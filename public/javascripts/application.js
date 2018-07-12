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
	},

	updateSelectedTags() {
		const checkedInputs = $('#toggle_tags input:checked');
		this.selectedTags = $.map(checkedInputs, input => input.value);
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
		$('.contact_form input[type=checkbox]').prop('checked', false);
	},

	validateInputs(event) {
		const input = event.target;
		const isValid = input.checkValidity();
		const $dl = $(input).closest('dl').removeClass('invalid');
		const $small = $(input).next();		

		if (isValid) {
			$small.html('');
		} else { 
			$dl.addClass('invalid');
			$small.html(`*a valid ${input.id} is required`);
		}
	},

	hideContactForm() {

	},
}

Contacts = {
	all: null,

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