import { Redirect } from 'expo-router';

/** Welcome — шаг 0 онбординга; маршрут оставлен для старых ссылок. */
export default function WelcomeRoute() {
  return <Redirect href="/onboarding" />;
}
