# Instructions for Saving the Hero Background Image

To complete the background image setup for your homepage:

1. Save the night-time rider image you shared to this path:
   ```
   images/hero-background.jpg
   ```

2. Make sure the image is high-resolution to look good on all screen sizes.

3. The CSS has already been updated to use this image with proper overlays for optimal text visibility.

4. The image will work seamlessly in both light and dark modes.

## Note
If the image appears too dark or light, you can adjust the overlay opacity in:
- `css/styles.css` - For light mode
- `css/dark-mode.css` - For dark mode

Look for the `background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('../images/hero-background.jpg');` line in both files and adjust the opacity values (the 0.5 and 0.7 values) as needed. 