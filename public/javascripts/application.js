var Template;
var App;
var Contacts;

$(function() {
const CONTACTS_PATH = '/api/contacts';
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
		$('ul#input_tags').html(toggleTagsHTML);
	},
}

App = {
	init() {
		this.selectedTags = TAGS;
		this.queryInput = '';

		$.get(CONTACTS_PATH, json => {
			Contacts.all = json;
			Template.renderContacts(json);
		});

		Template.renderToggleTags();
		this.bindEvents();
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
		$('#add').on('click', this.displayContactForm);
		$('button.cancel').on('click', this.hideContactForm);
		$('.contact_form').on('blur', 'dd > input', this.validateInputs);
		$('.contact_form').on('submit', this.saveNewContact);
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

	displayContactForm() {
		$('.contacts_list, .menu').hide();		
		$('.contact_form').fadeIn();
		$('.contact_form [type=checkbox]').prop('checked', false);
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

	hideContactForm(event) {
		event.preventDefault();
		this.resetInvalidityPrompts();
		$('.contact_form').hide();
		$('.contacts_list, .menu').fadeIn();	
	},

	saveNewContact(event) {
		event.preventDefault();
		const form = event.target;
		const data = this.formatFormData(form);

		if (form.checkValidity()) $.post(CONTACTS_PATH, data, 'json');
		Contacts.reload().then(() => Template.renderContacts(Contacts.all));

		this.hideContactForm(event);
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
}

Contacts = {
	all: null,

	reload() {
		return $.get(CONTACTS_PATH, json => this.all = json);
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
},

Template.init();
App.init();
});