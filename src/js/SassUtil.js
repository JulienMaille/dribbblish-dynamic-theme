export function lightOffset(n, offset) {
    return `calc(${n} + ${offset} * var(--is_light))`;
}

export function spiceColor(key, alpha = 1, _lightOffset = 0) {
    if (alpha == 1) {
        return `var(--spice-${key})`;
    } else if (_lightOffset == 0) {
        return `rgba(var(--spice-rgb-${key}), ${alpha})`;
    } else {
        return `rgba(var(--spice-rgb-${key}), ${lightOffset(alpha, _lightOffset)})`;
    }
}
