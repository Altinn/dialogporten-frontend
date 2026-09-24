# Embeddable markdown html

React components for rendering Markdown and Html at runtime.

Usage:

```jsx
import { Markdown, Html } from 'embeddable-markdown-html';

const Testcomponent = () => {
  return (
    <div>
      <Markdown onError={console.error}># header</Markdown>
      <Html onError={console.error}>{`<h1> header </h1>`}</Html>
    </div>
  );
}
```

Both components take the content as `children` and an `onError` callback, and both render the
same sanitized subset of HTML. `Markdown` parses CommonMark + GitHub flavoured markdown, and
passes raw HTML in the markdown through the same allow list, so a document can mix markdown
prose with the HTML needed for things markdown cannot express (forms).

## Supported elements

| Group    | Elements                                                                   |
| -------- | -------------------------------------------------------------------------- |
| Text     | `p` `em` `strong` `br` `span` `a` `code` `pre` `blockquote` `hr` `h1`–`h6`   |
| Lists    | `ul` `ol` `li`                                                              |
| Tables   | `table` `thead` `tbody` `tr` `th` `td`                                      |
| Forms    | `form` `fieldset` `legend` `label` `input` `textarea` `select` `optgroup` `option` `datalist` `button` `output` |

Everything else is removed. Unknown elements are unwrapped (their text is kept), while
`script`, `style`, `iframe`, `video`, `audio`, `object`, `embed`, `template`, `noscript`,
`svg` and `math` are dropped with their content.

## Forms

A form is authored as plain HTML, in an `html` document or inside a markdown one:

```html
<form action="https://serviceowner.example/dialogs/1/answers" method="post">
  <fieldset>
    <legend>Bekreft opplysninger</legend>
    <label for="name">Navn</label>
    <input id="name" name="name" type="text" required />
    <label for="county">Fylke</label>
    <select id="county" name="county">
      <option value="03">Oslo</option>
      <option value="11" selected>Rogaland</option>
    </select>
  </fieldset>
  <button type="submit">Send inn</button>
</form>
```

The rendered form never submits itself. Submission is handed to the host application, which
owns the transport (authentication headers, retries, what to show afterwards):

```jsx
<Markdown
  onError={onError}
  formPolicy={{ baseUrl: content.url }}
  onSubmit={({ action, method, formData, values }) => {
    /* the host decides how to send this */
  }}
>
  {markdown}
</Markdown>
```

`onSubmit` receives:

| Field       | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `action`    | Absolute, validated URL to submit to                                          |
| `method`    | `get` or `post`                                                               |
| `encType`   | Encoding the form asked for                                                   |
| `formData`  | `FormData` for the form, including the value of the button that submitted it   |
| `values`    | The same entries as a plain object, repeated names collected into an array     |
| `submitter` | The element that triggered the submit                                         |
| `form`      | The form element                                                              |

`formPolicy` controls how actions are resolved:

| Option            | Default | Description                                                                 |
| ----------------- | ------- | --------------------------------------------------------------------------- |
| `baseUrl`         | –       | URL the embedded document was loaded from. Relative actions resolve against it, and a form without an action submits back to it |
| `allowSameOrigin` | `false` | Allow actions that point at the host application's own origin                 |

Without an `onSubmit` handler the form still renders, but submitting is a no-op with a warning
on the console.

## Safety model

The content is written by service owners and rendered inside the host application's own origin,
so the renderer is treated as a boundary, not as a transformer:

- **Allow list, not deny list.** Only the elements and attributes listed above survive
  sanitizing. Event handler attributes (`onclick`, `onfocus`, …) and inline `style` (outside
  tables) are never among them, so embedded content cannot run script.
- **No navigation.** Every submit is intercepted, so embedded content can neither navigate the
  application away nor open windows. `target`, `formaction`, `formmethod`, `formtarget` and
  `formenctype` are removed, so a button cannot redirect the submission somewhere else.
- **Actions are validated before use.** They must be `https` (or `http` on localhost for local
  development), must not carry credentials, and must not point at the host application's own
  origin — a form posting to the application would travel with the user's session cookies.
- **No credential fields.** `input type="password"` is not rendered, so embedded content cannot
  ask the user for a password. `input type="image"` is not rendered either, as it doubles as a
  submit button and a remote image request.
- **Ids are namespaced.** `id`, `for`, `list`, `aria-labelledby` and `aria-describedby` are
  prefixed with `user-content-`, which keeps label and field associations intact while
  preventing embedded content from colliding with, or clobbering, the application's own DOM.
  Field `name`s are passed through untouched, since they are what the service owner receives.
- **Values, not state.** `value`, `checked` and `selected` are rendered as defaults, so fields
  stay editable for the user instead of being frozen by React.

## Inspired by

https://github.com/remarkjs/react-remark/tree/main
