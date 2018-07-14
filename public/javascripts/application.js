var Template;
var UI;
var App;
var Events;
var Form;
var Contacts;

$(function() {
const API_PATH = '/api/contacts';

const $form = $('.contact_form');
const $menu = $('.menu');
const $contactsListSection = $('.contacts_list');
const $contactsList = $('.contacts_list ul');
const $searchbar = $('input#searchbar');
const $addContactButton = $('button#add');
const $filterTagsList = $('ul#filter_tags');

Template = {
  init() {
    this.$templateElems = $('script[type*=x-handlebars]');
    this.compileTemplates();
    this.$templateElems.remove();   
  },

  compileTemplates() {
    this.$templateElems.each(function() {
      Template[this.id] = Handlebars.compile(this.innerHTML);
    });
  },
};

UI = {
  init() {
    this.renderContactsList(_.deepClone(Contacts.allData));
    this.renderFilterTags(Contacts.getAllTags());
  },

  renderContactsSection() {
    const filteredData = Contacts.getFilteredData();

    if (filteredData.length > 0) {
      this.renderContactsList(filteredData);
    } else {
      this.renderNoContactsFound(Contacts.searchQuery);
    }
  },

  renderContactsList(json) {
    const formatted = this.formatTagsForDisplay(json);
    const contactsHTML = Template.contacts({ contacts: formatted });
    $contactsList.html(contactsHTML);
  },

  formatTagsForDisplay(json) {
    json.forEach(obj => obj.tags = obj.tags.split(',').join(', '));
    return json;
  },

  renderNoContactsFound(query) {
    const messageHTML = Template.noContacts({ query: query });
    $contactsList.html(messageHTML);
  },  

  renderFilterTags(tags) {
    const filterTagsHTML = Template.tagFields({ fields: tags });
    $filterTagsList.html(filterTagsHTML);
    const $notTaggedLi = $('[value="not-tagged"]').closest('li')
    $filterTagsList.append($notTaggedLi);
    $filterTagsList.find('input:checkbox').prop('checked', true);
  },

  renderForm() {
    const data = Form.htmlData;
    const formHTML = Template.formContents(data);
    const tagsHTML = Template.tagFields({ fields: data.tags });
    $form.html(formHTML);
    $('ul#form_tags').prepend(tagsHTML);
  },

  displayForm() {
    $menu.hide();
    $contactsListSection.hide();
    $form.fadeIn();
  },

  hideForm() {
    $form.hide();
    $contactsListSection.fadeIn();
    $menu.fadeIn();
  },

  renderNewTagToForm(newTagName) {
    const newTagHTML = Template.newFormTag({ tag_name: newTagName });
    this.findLiContainsValue(newTagName).remove();
    $('ul#form_tags').append(newTagHTML);
  },

  findLiContainsValue(newTagName) {
    return $('ul#form_tags li').filter(function() {
      return $(this).find('[type=checkbox]').val() === newTagName;
    });
  },

  disableAddNewTag() {
    $('a#add_new_tag').addClass('isDisabled').text('Max allowed tags reached');
  },

  addInvalidityPrompt($dl) {
    $dl.addClass('invalid');
    const fieldName = $dl.find('input').prop('name');
    const warningText = `Please enter a valid ${fieldName.replace(/\_/g, ' ')}.`
    $dl.find('small').text(warningText);
  },

  resetInvalidityPrompts($dl) {
    $dl.removeClass('invalid');
    $dl.find('small').text('');
  },
}

Form = {
  init(action) {
    this.htmlData = null;
    this.maxAllowedTags = 8;
    this.maxTagLength = 16;
    if (action === 'create') this.formatAsCreateNew();
    if (action === 'update') this.formatAsUpdate();
    return this;
  },

  formatAsCreateNew() {
    this.htmlData = {
      title: 'Create New Contact',
      action: 'create',
      tags: _(Contacts.getAllTags()).without('not-tagged'),
    }
  },

  promptNewTagName() {
    let tagName = prompt('Please enter a new tag name: \n (only letters, numbers and underscores allowed)');
    if (tagName === null) return null;

    tagName = this.formatTagName(tagName);
    if (!tagName || tagName.length > this.maxTagLength) return false;
    return tagName;
  },

  maxAllowedTagsReached() {
    return $('ul#form_tags li').length >= this.maxAllowedTags;
  },

  hasSameTagNames() {
    return this.newTagNames.some(newTagName => {
      return Contacts.getAllTags().includes(newTagName);
    });
  },

  formatTagName(string) {
    return string.trim().toLowerCase().replace(/\W/g, '');
  },

  alertInvalidTagName() {
    alert(`Tag is empty or more than ${this.maxTagLength} characters!`);
  },

  compileFormData() {
    const form = $form[0];
    const $checkedInputs = $form.find('input:checked');
    const selectedTags = $.map($checkedInputs, input => input.value);

    return {
      full_name: form.full_name.value,
      email: form.email.value,
      phone_number: form.phone_number.value,
      tags: selectedTags.join(','),
    };    
  },

  send() {
    const action = this.htmlData.action;
    const id = this.htmlData.id;
    const formData = this.compileFormData();
    if (action === 'create') return Contacts.createNew(formData);
    if (action === 'update') return Contacts.update(formData, id);
  },
}

Contacts = {
  init() {
    this.allData = null;
    this.filterTags = [];
    this.searchQuery = '';
    return this;
  },

  getAllData() {
    return $.getJSON(API_PATH, json => { 
      this.allData = json;
    });
  },

  getAllTags() {
    const allTags = [];

    this.allData.forEach(obj => {
      obj.tags.split(',').forEach(tag => { 
        console.log([obj.tags], [tag]);
        allTags.push(tag || 'not-tagged');
      });
    });
    return _.uniq(allTags);
  },

  updateFilters() {
    const $checkedTags = $filterTagsList.find('input:checked');
    this.filterTags = $.map($checkedTags, input => input.value);
    this.searchQuery = $searchbar.val();
  },  

  getFilteredData() {
    return _.deepClone(this.allData).filter(obj => {
      return this.hasMatchTags(obj) && this.hasMatchQuery(obj);
    });
  },

  hasMatchTags(obj) {
    const tags = obj.tags || 'not-tagged';
    return tags.split(',').every(tag => this.filterTags.includes(tag));
  },

  hasMatchQuery(obj) {
    const query = this.searchQuery;
    const startWithFirstOrLastName = new RegExp(`^${query}|\\s${query}`, 'i');
    return obj.full_name.match(startWithFirstOrLastName);
  },

  createNew(data) {
    return $.post(API_PATH, data, 'json');
  },
}

App = {
  init() {
    Contacts.init().getAllData().then(() => UI.init());
    this.bindAllMethods();
    this.bindEvents();
  },

  bindAllMethods() {
    const methods = Object.keys(this).filter(prop => typeof this[prop] === 'function');
    methods.forEach(method => this[method] = this[method].bind(this));
  },

  bindEvents() {
    $filterTagsList.on('change', 'input', this.handleFilterChanged);
    $searchbar.on('input', _.debounce(this.handleFilterChanged, 300));
    $addContactButton.on('click', this.handleAddButtonClicked);
    $form.on('click', 'button#cancel', UI.hideForm);
    $form.on('click', 'a#add_new_tag', this.handleAddNewTagClicked);
    $form.on('blur', 'dd > input', this.handleInputOffFocus);
    $form.on('submit', this.handleFormSubmit);
    $contactsList.on('click', 'button.edit', this.handleEditButtonClicked);
  },

  handleFilterChanged() {
    Contacts.updateFilters();
    UI.renderContactsSection();
  },

  handleAddButtonClicked() {
    Form.init('create');
    UI.renderForm();
    UI.displayForm();
    if (Form.maxAllowedTagsReached()) UI.disableAddNewTag();
  },


  handleEditButtonClicked() {
    Form.init('update');
    UI.renderForm();
    UI.displayForm();
    if (Form.maxAllowedTagsReached()) UI.disableAddNewTag();    
  },  

  handleAddNewTagClicked(event) {
    event.preventDefault();
    if (event.target.className === 'isDisabled') return;

    const newTagName = Form.promptNewTagName();

    if (newTagName) { 
      UI.renderNewTagToForm(newTagName);
    } else if (newTagName !== null) {
      Form.alertInvalidTagName();
    }
    if (Form.maxAllowedTagsReached()) UI.disableAddNewTag();
  },

  handleInputOffFocus(event) {
    const input = event.target;
    const $dl = $(input).closest('dl');

    if (input.checkValidity()) {
      UI.resetInvalidityPrompts($dl);
    } else {
      UI.addInvalidityPrompt($dl);
    }
  },

  handleFormSubmit(event) {
    event.preventDefault();

    if ($form[0].checkValidity()) {
      Form.send().then(() => {
        return Contacts.getAllData();
      }).then(() => {
        UI.hideForm();         
        Contacts.updateFilters();         
        UI.renderContactsSection();
      });
    } else { 
      // invoke blur event handler to add invalidity prompts
      $form.find('input').trigger('blur');       
    }
  },
}

Template.init();
App.init();
});