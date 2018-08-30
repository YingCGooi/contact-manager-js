## Contact Manager
A contact manager built with jQuery, Handlebars and Flexbox.

Deployed version: https://contact-manager-js.herokuapp.com/

A customized underscore.js is created with methods implemented to suit the application's usage.

### Server
The server is built with Node/Express API Server. Navigating to localhost:3000/doc will list all available REST API endpoints. The client `application.js` uses these endpoints to perform CRUD actions. The response data is then used to render the application view in `index.html`.

### Objects
#### Template
- Contains all compiled Handlebars function
- Each template is assigned to an object's property with the respective template's id name.

#### UI
- Renders HTML for the DOM 
- Displays/hides elements (such as the contact form & invalidity prompts)
- Interacts with the Template and the Form objects to obtain content data for the HTML

#### Form
- Tracks various states and data for form rendering
- Controls the data that will be sent to Contacts object upon form submission
- Creates and validates new tags added by user

#### Contacts
A contact manager that can:
- Obtain all contact info
- Track current checked filter tags and search query
- Filter or update the cached data
- Interact with the server API by sending AJAX requests and parsing responses

#### App
- High-level application controller
- Attaches event handlers to elements which the user may interact with
- Processes event handlers upon firing of events
- Interacts with the UI, Form and Contacts object

### Responsive Breakpoints
Responsive breakpoints have been set to:
- 480px (mobile)
- 700px (tablet)
- 900px (tablet)
- 1200px (laptop)
- 1600px (laptop, or other bigger screens)



