var Template;
var App;
var Contacts;

$(function() {
const API_PATH = '/api/contacts';
const TAGS = ['work', 'friend', 'family', 'not-tagged'];

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

  renderContacts(json) {
    const contactsHTML = this.contacts({ contacts: json });
    $('.contacts_list ul').html(contactsHTML);
  },

  renderNoContacts(query) {
    const messageHTML = this.no_contacts({ query: query });
    $('.contacts_list ul').html(messageHTML);
  },  

  renderToggleTags() {
    const toggleTagsHTML = this.tag_fields({ fields: TAGS });
    $('ul#toggle_tags').html(toggleTagsHTML);
    $('ul#toggle_tags input:checkbox').prop('checked', true);   
    $('ul#input_tags').html(toggleTagsHTML);
  },
}

App = {
  init() {
    this.selectedTags = TAGS;
    this.queryInput = '';

    this.reloadAndRenderContacts();
    Template.renderToggleTags();
    this.bindEvents();
  },

  reloadAndRenderContacts() {
    Contacts.reload().done(() => Template.renderContacts(Contacts.all));
  },

  bindAllMethods() {
    const properties = Object.getOwnPropertyNames(this);
    const methods = properties.filter(prop => typeof this[prop] === 'function');
    _.bindAll(this, methods);
  },

  bindEvents() {
    this.bindAllMethods();
    $('ul#toggle_tags').on('change', 'input', this.filterByTags);
    $('#searchbar').on('input', _.debounce(this.filterByInputName, 300));
    $('button#add').on('click', this.displayNewContactForm);
    $('button.cancel').on('click', this.hideContactForm);
    $('.contact_form').on('blur', 'dd > input', this.validateInputs);
    $('.contact_form').on('submit', this.saveContact);
    $('.contacts_list').on('click', 'button.delete', this.deleteContact);
    $('.contacts_list').on('click', 'button.edit', this.displayEditContactForm);
  },

  updateSelectedTags() {
    const $checkedInputs = $('#toggle_tags input:checked');
    this.selectedTags = $.map($checkedInputs, input => input.value);
  },

  filterByTags() {
    this.updateSelectedTags();
    this.renderContactsSection();
  },

  filterByInputName() {
    this.queryInput = $('#searchbar').val();
    this.renderContactsSection();
  },  

  renderContactsSection() {
    const filteredContacts = Contacts.filtered();

    if (filteredContacts.length > 0) {
      Template.renderContacts(filteredContacts);
    } else {
      Template.renderNoContacts(this.queryInput);
    }
  },

  displayNewContactForm() {
    $('.contact_form h2').text('Create New Contact');
    $('button#update').hide().removeClass('update-active');
    $('button#create').show();
    this.displayContactForm();
  },

  displayEditContactForm(event) {
    const $updateButton = $('button#update');
    const id = event.target.dataset.id;
    $('.contact_form h2').text('Edit Contact');
    $('button#create').hide();
    $updateButton.show().addClass('update-active');

    this.attachIdToButton(id, $updateButton);
    this.displayContactForm();    
    this.fillOutForm(+id);
  },

  attachIdToButton(id, $button) {
    $button[0].dataset.id = id;
  },

  fillOutForm(id) {
    const data = Contacts.getContactById(id);
    const tags = data.tags.split(',');
    const form = document.querySelector('.contact_form');
    form.full_name.value = data.full_name;
    form.email.value = data.email;
    form.phone_number.value = data.phone_number;
    tags.forEach(tag => {
      $(form).find(`[value=${tag}]`).prop('checked', true);
    });
  },

  displayContactForm() {
    $('.contacts_list, .menu').hide();    
    $('.contact_form').fadeIn();
    $('.contact_form')[0].reset();
    $('.contact_form [value=not-tagged]').closest('li').remove();
  },

  validateInputs(event) {
    const input = event.target;
    const $dl = $(input).closest('dl');
    const invalidText = `*a valid ${input.id} is required`;

    if (input.checkValidity()) {
      this.resetInvalidityPrompts($dl);
    } else { 
      $dl.addClass('invalid');
      $dl.find('small').html(invalidText);
    }
  },

  resetInvalidityPrompts($elem = $('.contact_form dl')) {
    $elem.removeClass('invalid');
    $elem.find('small').html('');
  },

  hideContactForm() {
    this.resetInvalidityPrompts();
    $('.contact_form').hide();
    $('.contacts_list, .menu').fadeIn();
  },

  saveContact(event) {
    event.preventDefault();
    const form = event.target;
    const isUpdate = $('button#update').hasClass('update-active');
    const data = this.formatFormData(form);

    if(isUpdate) this.updateContact(form, data);
    if(!isUpdate) this.createNewContact(form, data);
  },

  updateContact(form, data) {
    const id = $('button#update').data('id');
    if (form.checkValidity()) {
      $.ajax({
        url: API_PATH + '/' + id,
        method: 'PUT',
        data: data,
        dataType: 'json',
        success: () => this.refreshPage(form),
      });
    } else {
      $('.contact_form input').trigger('blur');
    }
  },

  createNewContact(form, data) {
    if (form.checkValidity()) {
      $.post(API_PATH, data, () => this.refreshPage(form), 'json');
    } else {
      $('.contact_form input').trigger('blur');
    }
  },

  refreshPage(form = $('.contact_form')[0]) {
    this.reloadAndRenderContacts();
    this.hideContactForm();
    form.reset();
  },

  formatFormData(form) {
    const $checkedInputs = $(form).find('input:checked');
    const selectedTags = $.map($checkedInputs, input => input.value);

    return {
      full_name: form.name.value,
      email: form.email.value,
      phone_number: form.phone_number.value,
      tags: selectedTags.join(','),
    }
  },

  deleteContact(event) {
    const $button = $(event.target);
    const id = $button.data('id');
    const name = $button.data('name');
    const isConfirmDelete = confirm(`Are you sure you want to delete "${name}"?`);

    if (isConfirmDelete) {
      $.ajax({ 
        url: API_PATH + '/' + id, 
        method: 'DELETE',
        success: () => this.reloadAndRenderContacts(),
      });
    }
  },
}

Contacts = {
  all: null,

  reload() {
    return $.get(API_PATH, json => this.all = json);
  },

  filtered() {
    return this.all.filter(obj => {
      return this.matchTags(obj) && this.matchQuery(obj)
    });
  },

  matchTags(obj) {
    const tags = obj.tags || 'not-tagged';
    return tags.split(',').every(tag => App.selectedTags.includes(tag));
  },

  matchQuery(obj) {
    const regexStartWithQuery = new RegExp('^' + App.queryInput, 'i');
    return obj.full_name.match(regexStartWithQuery);
  },

  getContactById(id) {
    return this.all.find(obj => obj.id === +id);  
  },
},

Template.init();
App.init();
});