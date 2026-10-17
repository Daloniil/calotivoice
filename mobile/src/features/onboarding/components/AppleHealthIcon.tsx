import Svg, { Path, Rect } from 'react-native-svg';

type AppleHealthIconProps = {
  size?: number;
  variant?: 'light' | 'dark';
};

/** Иконка Apple Health — тёмно-красный тайл и розовое сердце (как в Health). */
export function AppleHealthIcon({ size = 36, variant = 'dark' }: AppleHealthIconProps) {
  const tileFill = variant === 'dark' ? '#3D2228' : '#FFFFFF';
  const radius = size * (6.5 / 28);

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect width={28} height={28} rx={radius} fill={tileFill} />
      <Path
        d="M14 21.5c-.3 0-.6-.1-.8-.3C10.2 18.8 7 15.8 7 12.4c0-2.4 1.9-4.3 4.2-4.3 1.3 0 2.5.6 3.3 1.6.8-1 2-1.6 3.3-1.6 2.3 0 4.2 1.9 4.2 4.3 0 3.4-3.2 6.4-6.2 8.8-.2.2-.5.3-.8.3z"
        fill="#FF2D55"
      />
    </Svg>
  );
}
