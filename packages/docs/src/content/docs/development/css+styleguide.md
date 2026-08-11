---
title: "CSS Styleguide"
---
This minimalistic style guide is designed to ensure consistency and scalability in our frontend projects.

## Class naming conventions

- Use **camelCase** for class names to maintain consistency with JavaScript naming conventions.

  ```css
  /* Example */
  .profileCard { ... }
  .userInfo { ... }
  ```

## File structure for CSS module
Name your CSS module files using the pattern [nameOfComponent].module.css, matching the name of the JSX component they style.

Place the *.module.css file in the same folder as its corresponding JSX component to keep styles closely tied to their components.

A *.module.css file should not be shared among components to ensure styles are encapsulated. The exception is a global module (e.g., global.module.css) for defining global or root variables, which is only indirectly imported.

Encapsulation: Keep styles encapsulated within their respective component module to avoid unintended side effects and maintain component isolation.

Global Styles: Utilize a global CSS module for defining root-level CSS custom properties (variables) and global styles. This approach promotes consistency and reusability across components.

  ```css
  /components
    /Button
        Button.tsx
        button.module.css
    /Header
        Header.tsx
        header.module.css
  ```

## Conventions

### Variables
Prefer using variables (whether from custom globals or tokens from `@digdir/designsystemet-theme`).

 ```css
   :root {
    --example-color: #fff;
  }
  
  .user {
    background-color: var(--example-color); /* This property will take the current variable value */
  }
  ```

It's cleaner, easier to maintain and works great in conjunction with [@digdir/designsystemet-theme](https://github.com/digdir/designsystemet).

### CSS Units

The general rule of thumb is to to prefer `rem` for adaptive design that meets `wcag`, and `px` where more consistent / restrict
control is needed. C.f. with table below for examples:

| Use Case                     | Preferred Unit | Reasoning                                                                                                                                 | Example                                  |
|------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Adaptive Design (general)    | `rem`          | Favors simplicity and scalability over `em` for relative sizing and `px` for fixed sizing.                                                | `font-size: 1.6rem;`                     |
| Fixed-Size Elements          | `px`           | Ensures design consistency across zoom levels and screen sizes for elements where precise dimensions are critical.                        | `border: 1px solid black;`               |
| Borders and Shadows          | `px`           | Requires precision for visual consistency.                                                                                                 | `box-shadow: 0px 2px 4px rgba(0,0,0,0.1);`|
| Breakpoints in Media Queries | `px`           | Provides control and consistency across devices.                                                                                           | `@media (min-width: 768px) { ... }`      |
| Lines and Dividers           | `px`           | Ensures thin, consistent lines regardless of device or zoom.                                                                               | `border-bottom: 1px solid #ccc;`         |
| Icons and Small Images       | `px` or `%`    | Prevents distortion and maintains size relative to layout. `%` can be used for responsiveness without distortion.                          | `width: 16px; height: 16px;`             |
| Fixed Layout Components      | `px`           | Maintains specific sizes for components critical to the layout's structure.                                                                | `width: 200px;`                          |
| Minimum and Maximum Sizes    | `px`           | Establishes a consistent baseline that doesn't vary with user settings or screen sizes.                                                    | `min-width: 300px; max-width: 600px;`    |
| Zero-Sized Elements          | `0`            | There's no need to specify a unit for zero values; it's the same for all units.                                                            | `margin: 0;`                             |


### colors
Avoid using color keywords (`e.g. color: red;`), instead use hexadecimal color codes.
CSS Level 1, Level 2 and Level 3 indicate that using color names is perfectly acceptable, but which ones are acceptable varies depending on the specification.
Copy from Figma will be in hex or `rgba` most likely anyway.
Hex should be in lowercase.



