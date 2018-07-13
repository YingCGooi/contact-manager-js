var Template;
var UI;
var App;
var Events;
var Form;
var Contacts;

$(function() {
const API_PATH = '/api/contacts';

const $form = $('.contact_form');
const $contactsList = $('.contacts_list ul');
const $searchbar = $('input#searchbar');
const $addContactButton = $('button#add');
const $filterTagsList = $('ul#filter_tags');
const $formTagsList = $('ul#form_tags');

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
    this.renderContactsList(Contacts.allData);
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
    const contactsHTML = Template.contacts({ contacts: json });
    $contactsList.html(contactsHTML);
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

  renderForm(formData, tags) {
    const formHTML = Template.formContents(formData);
    const tagsHTML = Template.tagFields({ fields: tags });    
    $form.find('fieldset').html(formHTML);
    $formTagsList.prepend(tagsHTML);
  },
}

Contacts = {
  init() {
    this.allData = null;
    this.filterTags = [];
    this.searchQuery = '';
    return this.getAllData();
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
        if (!allTags.includes(tag)) allTags.push(tag || 'not-tagged');
      });
    });
    return allTags;
  },

  updateFilters() {
    const $checkedTags = $filterTagsList.find('input:checked');
    this.filterTags = $.map($checkedTags, input => input.value);
    this.searchQuery = $searchbar.val();
  },  

  getFilteredData() {
    return this.allData.filter(obj => {
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
}

App = {
  init() {
    Contacts.init().done(() => UI.init());
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
    $addContactButton.on('click', this.displayNewContactForm);
  },

  handleFilterChanged() {
    Contacts.updateFilters();
    UI.renderContactsSection();
  },
}

Template.init();
App.init();
});