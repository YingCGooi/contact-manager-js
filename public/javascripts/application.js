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

	renderToggleTags() {
		const toggleTagsHTML = this.tag_fields({ fields: TAGS });
		$('ul.toggle_tags').html(toggleTagsHTML);
	},

	renderNoContacts(query) {
		const messageHTML = this.no_contacts({ query: query });
		$('.contacts_list ul').html(messageHTML);
	},
}

App = {
	init() {
		this.selectedTags = this.updateSelectedTags();
		this.queryInput = '';

		$.getJSON(CONTACTS_PATH, json => {
			Contacts.all = json;
			Template.renderContacts(json);
		});

		Template.renderToggleTags();
		this.bindEvents();
	},

	bindEvents() {
		$('ul.toggle_tags').on('change', 'input', this.filterByTags.bind(this));
		$('#searchbar').on('input', debounce(this.filterByInputName.bind(this), 300));
	},

	updateSelectedTags() {
		const checkedInputs = $('.toggle_tags input:checked');
		this.selectedTags = $.map(checkedInputs, input => input.value);
	},

	filterByTags() {
		this.updateSelectedTags();
		this.renderFilteredContacts();
	},

	filterByInputName() {
		this.queryInput = $('#searchbar').val();
		this.renderFilteredContacts();
	},	

	renderFilteredContacts() {
		const filteredContacts = Contacts.filtered();

		if (filteredContacts.length > 0) {
			Template.renderContacts(filteredContacts);
		} else {
			Template.renderNoContacts(this.queryInput);
		}
	},
}

Contacts = {
	init() {
		this.all = null;
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
Contacts.init();
App.init();
});