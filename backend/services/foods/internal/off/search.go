package off

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	searchALicious = "https://search.openfoodfacts.org/search"
	searchLegacy   = "https://world.openfoodfacts.org/cgi/search.pl"
)

type Per100g struct {
	Kcal          *float64 `json:"kcal"`
	ProteinG      *float64 `json:"proteinG"`
	FatG          *float64 `json:"fatG"`
	CarbsG        *float64 `json:"carbsG"`
	FiberG        *float64 `json:"fiberG,omitempty"`
	SugarsG       *float64 `json:"sugarsG,omitempty"`
	SodiumMg      *float64 `json:"sodiumMg,omitempty"`
	SaturatedFatG *float64 `json:"saturatedFatG,omitempty"`
}

type FoodItem struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Per100g Per100g `json:"per100g"`
	Source  string  `json:"source"`
	Barcode *string `json:"barcode,omitempty"`
}

type SearchResult struct {
	Items    []FoodItem `json:"items"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
	HasMore  bool       `json:"has_more"`
}

const DefaultPageSize = 10

type Client struct {
	httpClient *http.Client
	userAgent  string
}

func NewClient(userAgent, timeout string) (*Client, error) {
	d, err := time.ParseDuration(timeout)
	if err != nil {
		d = 20 * time.Second
	}
	return &Client{
		httpClient: &http.Client{Timeout: d},
		userAgent:  userAgent,
	}, nil
}

func (c *Client) Search(ctx context.Context, query string, page, pageSize int) (SearchResult, error) {
	q := strings.TrimSpace(query)
	if len(q) < 2 {
		return emptySearchResult(page, pageSize), nil
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	if pageSize > 50 {
		pageSize = 50
	}

	res, err := c.searchALicious(ctx, q, page, pageSize)
	if err == nil {
		return res, nil
	}
	fallback, fbErr := c.searchLegacy(ctx, q, page, pageSize)
	if fbErr != nil {
		return SearchResult{}, err
	}
	return fallback, nil
}

func emptySearchResult(page, pageSize int) SearchResult {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	return SearchResult{
		Items:    []FoodItem{},
		Total:    0,
		Page:     page,
		PageSize: pageSize,
		HasMore:  false,
	}
}

func finalizeSearchResult(items []FoodItem, total, page, pageSize int) SearchResult {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	if total < 0 {
		total = 0
	}
	shown := (page-1)*pageSize + len(items)
	hasMore := len(items) >= pageSize && (total == 0 || shown < total)
	return SearchResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
	}
}

type nutriments struct {
	EnergyKcal100g   *float64 `json:"energy-kcal_100g"`
	EnergyKcal       *float64 `json:"energy-kcal"`
	Proteins100g     *float64 `json:"proteins_100g"`
	Fat100g          *float64 `json:"fat_100g"`
	Carbohydrates100g *float64 `json:"carbohydrates_100g"`
	Fiber100g        *float64 `json:"fiber_100g"`
	Sugars100g       *float64 `json:"sugars_100g"`
	Sodium100g       *float64 `json:"sodium_100g"`
	SaturatedFat100g *float64 `json:"saturated-fat_100g"`
}

type product struct {
	Code           string      `json:"code"`
	ProductName    string      `json:"product_name"`
	ProductNameEn  string      `json:"product_name_en"`
	Brands         interface{} `json:"brands"`
	Nutriments     nutriments  `json:"nutriments"`
}

type aLiciousResponse struct {
	Hits  []product `json:"hits"`
	Count int       `json:"count"`
}

type legacyResponse struct {
	Products []product `json:"products"`
	Count    int       `json:"count"`
}

func (c *Client) searchALicious(ctx context.Context, query string, page, pageSize int) (SearchResult, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("page", strconv.Itoa(page))
	params.Set("page_size", strconv.Itoa(pageSize))
	u := searchALicious + "?" + params.Encode()

	var data aLiciousResponse
	if err := c.getJSON(ctx, u, &data); err != nil {
		return SearchResult{}, err
	}
	items := mapProducts(data.Hits)
	return finalizeSearchResult(items, data.Count, page, pageSize), nil
}

func (c *Client) searchLegacy(ctx context.Context, query string, page, pageSize int) (SearchResult, error) {
	params := url.Values{}
	params.Set("search_terms", query)
	params.Set("search_simple", "1")
	params.Set("action", "process")
	params.Set("json", "1")
	params.Set("page", strconv.Itoa(page))
	params.Set("page_size", strconv.Itoa(pageSize))
	params.Set("fields", "code,product_name,product_name_en,brands,nutriments")
	u := searchLegacy + "?" + params.Encode()

	var data legacyResponse
	if err := c.getJSON(ctx, u, &data); err != nil {
		return SearchResult{}, err
	}
	items := mapProducts(data.Products)
	return finalizeSearchResult(items, data.Count, page, pageSize), nil
}

func (c *Client) getJSON(ctx context.Context, rawURL string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", c.userAgent)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("open food facts HTTP %d", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 8<<20))
	if err != nil {
		return err
	}
	if err := json.Unmarshal(body, dest); err != nil {
		return err
	}
	return nil
}

func mapProducts(list []product) []FoodItem {
	out := make([]FoodItem, 0, len(list))
	for _, p := range list {
		if item, ok := mapProduct(p); ok {
			out = append(out, item)
		}
	}
	return out
}

func mapProduct(p product) (FoodItem, bool) {
	name := displayName(p)
	if name == "" {
		return FoodItem{}, false
	}
	code := strings.TrimSpace(p.Code)
	id := "off-" + slug(name)
	if code != "" {
		id = "off-" + code
	}
	var barcode *string
	if code != "" {
		barcode = &code
	}
	return FoodItem{
		ID:      id,
		Name:    name,
		Per100g: mapNutriments(p.Nutriments),
		Source:  "open_food_facts",
		Barcode: barcode,
	}, true
}

func mapNutriments(n nutriments) Per100g {
	kcal := n.EnergyKcal100g
	if kcal == nil {
		kcal = n.EnergyKcal
	}
	var sodiumMg *float64
	if n.Sodium100g != nil {
		v := *n.Sodium100g * 1000
		sodiumMg = &v
	}
	return Per100g{
		Kcal:          kcal,
		ProteinG:      n.Proteins100g,
		FatG:          n.Fat100g,
		CarbsG:        n.Carbohydrates100g,
		FiberG:        n.Fiber100g,
		SugarsG:       n.Sugars100g,
		SodiumMg:      sodiumMg,
		SaturatedFatG: n.SaturatedFat100g,
	}
}

func displayName(p product) string {
	name := strings.TrimSpace(p.ProductName)
	if name == "" {
		name = strings.TrimSpace(p.ProductNameEn)
	}
	brand := brandsLabel(p.Brands)
	if name != "" && brand != "" {
		return strings.TrimSpace(name + " " + brand)
	}
	if name != "" {
		return name
	}
	return brand
}

func brandsLabel(v interface{}) string {
	switch b := v.(type) {
	case string:
		return strings.TrimSpace(b)
	case []interface{}:
		parts := make([]string, 0, len(b))
		for _, x := range b {
			if s, ok := x.(string); ok && strings.TrimSpace(s) != "" {
				parts = append(parts, strings.TrimSpace(s))
			}
		}
		return strings.Join(parts, ", ")
	default:
		return ""
	}
}

func slug(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = strings.ReplaceAll(s, " ", "-")
	return s
}
