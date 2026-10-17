import { useEffect, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

type Props = {
  prefix?: string;
  text: string;
  showCaret: boolean;
  style?: StyleProp<TextStyle>;
  prefixStyle?: StyleProp<TextStyle>;
  caretStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/** Muted placeholder line with optional prefix and blinking caret. */
export function TypewriterPlaceholderText({
  prefix,
  text,
  showCaret,
  style,
  prefixStyle,
  caretStyle,
  numberOfLines = 1,
}: Props) {
  const [caretVisible, setCaretVisible] = useState(true);

  useEffect(() => {
    if (!showCaret) {
      setCaretVisible(false);
      return;
    }
    setCaretVisible(true);
    const id = setInterval(() => setCaretVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [showCaret]);

  return (
    <Text ellipsizeMode="tail" style={style} numberOfLines={numberOfLines}>
      {prefix ? <Text style={prefixStyle ?? style}>{prefix}</Text> : null}
      {text}
      {showCaret && caretVisible ? <Text style={[styles.caret, caretStyle]}>|</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  caret: {
    opacity: 0.55,
  },
});
