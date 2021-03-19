const prefixes = {
  '|=':
    'Attribute Contains Prefix. Selects elements that have the specified attribute with a value either equal to a given string or starting with that string followed by a hyphen (-).',
  '*=':
    'Attribute Contains. Selects elements that have the specified attribute with a value containing a given substring.',
  '~=':
    'Attribute Contains Word. Selects elements that have the specified attribute with a value containing a given word, delimited by spaces.',
  '$=':
    'Attribute Ends With. Selects elements that have the specified attribute with a value ending exactly with a given string. The comparison is case sensitive.',
  '=':
    'Attribute Equals. Selects elements that have the specified attribute with a value exactly equal to a certain value.',
  '!=':
    'Attribute Not Equal. Select elements that either don’t have the specified attribute, or do have the specified attribute but not with a certain value.',
  '^=':
    'Attribute Starts With. Selects elements that have the specified attribute with a value beginning exactly with a given string.',
  '':
    'Has Attribute. Selects elements that have the specified attribute, with any value.'
};

const core = {
  '.$1': 'Selects all elements with the given class attribute.',
  '#$1': 'Selects a single element with the given id attribute.'
};

const relative = {
  '*': 'Selects all elements.',
  '>':
    'Child. Selects all direct child elements specified by “child” of elements specified by “parent”.',
  ' ':
    'Child. Selects all nested child elements specified by “child” of elements specified by “parent”.',
  '+':
    'Next Adjacent. Selects all next elements matching “next” that are immediately preceded by a sibling “prev”.',
  '~':
    'Next Siblings. Selects all sibling elements that follow after the “prev” element, have the same parent, and match the filtering “siblings” selector.'
};

const pseudo = {
  ':checked': 'Matches all elements that are checked or selected.',
  ':contains($1)': 'Select all elements that contain the specified text.',
  ':disabled': 'Selects all elements that are disabled.',
  ':empty': 'Select all elements that have no children (including text nodes).',
  ':enabled': 'Selects all elements that are enabled.',
  ':eq($1)': 'Select the element at index n within the matched set.',
  ':first': 'Selects the first matched DOM element.',
  ':last': 'Selects the last matched element.',
  ':not($1)': 'Selects all elements that do not match the given selector.',
  ':nth-child($1)':
    'Selects all elements that are the nth-child of their parent.',
  ':parent':
    'Select all elements that have at least one child node (either an element or text).',
  ':submit': 'Selects all elements of type submit.',
  ':visible': 'Selects all elements that are visible.',
  ':animated':
    'Select all elements that are in the progress of an animation at the time the selector is run.',
  ':button': 'Selects all button elements and elements of type button.',
  ':checkbox': 'Selects all elements of type checkbox.',
  ':even': 'Selects even elements, zero-indexed.  See also :odd.',
  ':file': 'Selects all elements of type file.',
  ':first-child':
    'Selects all elements that are the first child of their parent.',
  ':first-of-type':
    'Selects all elements that are the first among siblings of the same element name.',
  ':focus': 'Selects element if it is currently focused.',
  ':gt($1)':
    'Select all elements at an index greater than index within the matched set.',
  ':has($1)':
    'Selects elements which contain at least one element that matches the specified selector.',
  ':header':
    'Selects all elements that are headers, like h1, h2, h3 and so on.',
  ':hidden': 'Selects all elements that are hidden.',
  ':image': 'Selects all elements of type image.',
  ':input': 'Selects all input, textarea, select and button elements.',
  ':lang($1)': 'Selects all elements of the specified language.',
  ':last-child':
    'Selects all elements that are the last child of their parent.',
  ':last-of-type':
    'Selects all elements that are the last among siblings of the same element name.',
  ':lt($1)':
    'Select all elements at an index less than index within the matched set.',
  ':nth-last-child($1)':
    'Selects all elements that are the nth-child of their parent, counting from the last element to the first.',
  ':nth-last-of-type($1)':
    'Selects all the elements that are the nth-child of their parent in relation to siblings with the same element name, counting from the last element to the first.',
  ':nth-of-type($1)':
    'Selects all elements that are the nth child of their parent in relation to siblings with the same element name.',
  ':odd': 'Selects odd elements, zero-indexed.  See also :even.',
  ':only-child':
    'Selects all elements that are the only child of their parent.',
  ':only-of-type':
    'Selects all elements that have no siblings with the same element name.',
  ':password': 'Selects all elements of type password.',
  ':radio': 'Selects all  elements of type radio.',
  ':reset': 'Selects all elements of type reset.',
  ':root': 'Selects the element that is the root of the document.',
  ':selected': 'Selects all elements that are selected.',
  ':target':
    'Selects the target element indicated by the fragment identifier of the document’s URI.',
  ':text': 'Selects all input elements of type text.'
};

const attributes = {
  'data-$1': 'Specifies custom attribute.',
  'aria-$1': 'Specifies an accessibility label.',
  id: 'Specifies a unique id for an element',
  class:
    'Specifies one or more classnames for an element (refers to a class in a style sheet)',
  label: 'Specifies the title of the text track',
  alt: 'Specifies an alternate text when the original element fails to display',
  name:
    'Belongs to <button>, <fieldset>, <form>, <iframe>, <input>, <map>, <meta>, <object>, <output>, <param>, <select>, <textarea>. Specifies the name of the element',
  placeholder:
    'Belongs to <input>, <textarea>. Specifies a short hint that describes the expected value of the element',
  disabled:
    'Belongs to <button>, <fieldset>, <input>, <optgroup>, <option>, <select>, <textarea>. Specifies that the specified element/group of elements should be disabled',
  hidden: 'Specifies that an element is not yet, or is no longer, relevant',
  title: 'Specifies extra information about an element',
  href:
    'Belongs to <a>, <area>, <base>, <link>. Specifies the URL of the page the link goes to',
  accept:
    'Belongs to <input>. Specifies the types of files that the server accepts (only for type="file")',
  checked:
    'Belongs to <input>. Specifies that an <input> element should be pre-selected when the page loads (for type="checkbox" or type="radio")',
  color:
    'Belongs to Not supported in HTML 5. Specifies the text color of an element. Use CSS instead',
  contenteditable:
    'Specifies whether the content of an element is editable or not',
  draggable: 'Specifies whether an element is draggable or not',
  form:
    'Belongs to <button>, <fieldset>, <input>, <label>, <meter>, <object>, <output>, <select>, <textarea>. Specifies the name of the form the element belongs to',
  required:
    'Belongs to <input>, <select>, <textarea>. Specifies that the element must be filled out before submitting the form',
  src:
    'Belongs to <audio>, <embed>, <iframe>, <img>, <input>, <script>, <source>, <track>, <video>. Specifies the URL of the media file',
  selected:
    'Belongs to <option>. Specifies that an option should be pre-selected when the page loads',
  style: 'Specifies an inline CSS style for an element',
  type:
    'Belongs to <a>, <button>, <embed>, <input>, <link>, <menu>, <object>, <script>, <source>, <style>. Specifies the type of element',
  value:
    'Belongs to <button>, <input>, <li>, <option>, <meter>, <progress>, <param>. Specifies the value of the element',
  'accept-charset':
    'Belongs to <form>. Specifies the character encodings that are to be used for the form submission',
  accesskey: 'Specifies a shortcut key to activate/focus an element',
  action:
    'Belongs to <form>. Specifies where to send the form-data when a form is submitted',
  align:
    'Belongs to Not supported in HTML 5. Specifies the alignment according to surrounding elements. Use CSS instead',
  async:
    'Belongs to <script>. Specifies that the script is executed asynchronously (only for external scripts)',
  autocomplete:
    'Belongs to <form>, <input>. Specifies whether the <form> or the <input> element should have autocomplete enabled',
  autofocus:
    'Belongs to <button>, <input>, <select>, <textarea>. Specifies that the element should automatically get focus when the page loads',
  autoplay:
    'Belongs to <audio>, <video>. Specifies that the audio/video will start playing as soon as it is ready',
  bgcolor:
    'Belongs to Not supported in HTML 5. Specifies the background color of an element. Use CSS instead',
  border:
    'Belongs to Not supported in HTML 5. Specifies the width of the border of an element. Use CSS instead',
  charset: 'Belongs to <meta>, <script>. Specifies the character encoding',
  cite:
    'Belongs to <blockquote>, <del>, <ins>, <q>. Specifies a URL which explains the quote/deleted/inserted text',
  cols: 'Belongs to <textarea>. Specifies the visible width of a text area',
  colspan:
    'Belongs to <td>, <th>. Specifies the number of columns a table cell should span',
  content:
    'Belongs to <meta>. Gives the value associated with the http-equiv or name attribute',
  controls:
    'Belongs to <audio>, <video>. Specifies that audio/video controls should be displayed (such as a play/pause button etc)',
  coords: 'Belongs to <area>. Specifies the coordinates of the area',
  data:
    'Belongs to <object>. Specifies the URL of the resource to be used by the object',
  datetime: 'Belongs to <del>, <ins>, <time>. Specifies the date and time',
  default:
    "Belongs to <track>. Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate",
  defer:
    'Belongs to <script>. Specifies that the script is executed when the page has finished parsing (only for external scripts)',
  dir: 'Specifies the text direction for the content in an element',
  dirname:
    'Belongs to <input>, <textarea>. Specifies that the text direction will be submitted',
  download:
    'Belongs to <a>, <area>. Specifies that the target will be downloaded when a user clicks on the hyperlink',
  enctype:
    'Belongs to <form>. Specifies how the form-data should be encoded when submitting it to the server (only for method="post")',
  for:
    'Belongs to <label>, <output>. Specifies which form element(s) a label/calculation is bound to',
  formaction:
    'Belongs to <button>, <input>. Specifies where to send the form-data when a form is submitted. Only for type="submit"',
  headers:
    'Belongs to <td>, <th>. Specifies one or more headers cells a cell is related to',
  height:
    'Belongs to <canvas>, <embed>, <iframe>, <img>, <input>, <object>, <video>. Specifies the height of the element',
  high:
    'Belongs to <meter>. Specifies the range that is considered to be a high value',
  hreflang:
    'Belongs to <a>, <area>, <link>. Specifies the language of the linked document',
  ismap: 'Belongs to <img>. Specifies an image as a server-side image map',
  kind: 'Belongs to <track>. Specifies the kind of text track',
  lang: "Specifies the language of the element's content",
  list:
    'Belongs to <input>. Refers to a <datalist> element that contains pre-defined options for an <input> element',
  loop:
    'Belongs to <audio>, <video>. Specifies that the audio/video will start over again, every time it is finished',
  low:
    'Belongs to <meter>. Specifies the range that is considered to be a low value',
  max: 'Belongs to <input>, <meter>, <progress>. Specifies the maximum value',
  maxlength:
    'Belongs to <input>, <textarea>. Specifies the maximum number of characters allowed in an element',
  media:
    'Belongs to <a>, <area>, <link>, <source>, <style>. Specifies what media/device the linked document is optimized for',
  method:
    'Belongs to <form>. Specifies the HTTP method to use when sending form-data',
  min: 'Belongs to <input>, <meter>. Specifies a minimum value',
  multiple:
    'Belongs to <input>, <select>. Specifies that a user can enter more than one value',
  muted:
    'Belongs to <video>, <audio>. Specifies that the audio output of the video should be muted',
  novalidate:
    'Belongs to <form>. Specifies that the form should not be validated when submitted',
  open:
    'Belongs to <details>. Specifies that the details should be visible (open) to the user',
  optimum:
    'Belongs to <meter>. Specifies what value is the optimal value for the gauge',
  pattern:
    "Belongs to <input>. Specifies a regular expression that an <input> element's value is checked against",
  poster:
    'Belongs to <video>. Specifies an image to be shown while the video is downloading, or until the user hits the play button',
  preload:
    'Belongs to <audio>, <video>. Specifies if and how the author thinks the audio/video should be loaded when the page loads',
  readonly:
    'Belongs to <input>, <textarea>. Specifies that the element is read-only',
  rel:
    'Belongs to <a>, <area>, <form>, <link>. Specifies the relationship between the current document and the linked document',
  reversed:
    'Belongs to <ol>. Specifies that the list order should be descending (9,8,7...)',
  rows:
    'Belongs to <textarea>. Specifies the visible number of lines in a text area',
  rowspan:
    'Belongs to <td>, <th>. Specifies the number of rows a table cell should span',
  sandbox:
    'Belongs to <iframe>. Enables an extra set of restrictions for the content in an <iframe>',
  scope:
    'Belongs to <th>. Specifies whether a header cell is a header for a column, row, or group of columns or rows',
  shape: 'Belongs to <area>. Specifies the shape of the area',
  size:
    'Belongs to <input>, <select>. Specifies the width, in characters (for <input>) or specifies the number of visible options (for <select>)',
  sizes:
    'Belongs to <img>, <link>,<source>. Specifies the size of the linked resource',
  span: 'Belongs to <col>, <colgroup>. Specifies the number of columns to span',
  spellcheck:
    'Specifies whether the element is to have its spelling and grammar checked or not',
  srcdoc:
    'Belongs to <iframe>. Specifies the HTML content of the page to show in the <iframe>',
  srclang:
    'Belongs to <track>. Specifies the language of the track text data (required if kind="subtitles")',
  srcset:
    'Belongs to <img>, <source>. Specifies the URL of the image to use in different situations',
  start: 'Belongs to <ol>. Specifies the start value of an ordered list',
  step:
    'Belongs to <input>. Specifies the legal number intervals for an input field',
  tabindex: 'Specifies the tabbing order of an element',
  target:
    'Belongs to <a>, <area>, <base>, <form>. Specifies the target for where to open the linked document or where to submit the form',
  translate:
    'Specifies whether the content of an element should be translated or not',
  usemap:
    'Belongs to <img>, <object>. Specifies an image as a client-side image map',
  width:
    'Belongs to <canvas>, <embed>, <iframe>, <img>, <input>, <object>, <video>. Specifies the width of the element',
  wrap:
    'Belongs to <textarea>. Specifies how the text in a text area is to be wrapped when submitted in a form'
};

module.exports = {
  prefixes,
  core,
  relative,
  pseudo,
  attributes
};
