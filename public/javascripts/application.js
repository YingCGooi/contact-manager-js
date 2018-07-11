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
		this.selectedTags = null;
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

	filterByTags() {
		const checkedInputs = $('.toggle_tags input:checked');
		this.selectedTags = $.map(checkedInputs, input => input.value);
		const filteredContacts = this.selectContactsByTags(selectedTags);
		Template.renderContacts(filteredContacts);
	},

	selectContactsByTags(selectedTags) {
 		return this.contacts.filter(obj => {
			const tags = obj.tags || 'not-tagged';
			return tags.split(',').every(tag => selectedTags.includes(tag));			
		});
	},

	filterByInputName(event) {
		const query = event.target.value;
		event.preventDefault();
		const filteredContacts = this.selectContactsByName(query);

		if (filteredContacts.length > 0) {
			Template.renderContacts(filteredContacts);
		} else {
			Template.renderNoContacts(query);
		}
	},

	selectContactsByName(query) {
		const regexStartWithQuery = new RegExp('^' + query, 'i');
		return this.contacts.filter(obj => obj.full_name.match(regexStartWithQuery));
	},
}

Contacts = {
	init() {
		this.all = null;
	},

	selectByTags() {
		const checkedInputs = $('.toggle_tags input:checked');
		this.tagsChecked = $.map(checkedInputs, input => input.value);
		return this.filterContacts();
	},

	selectByInputName() {
		this.queryInput = $('#searchbar').val();
		return this.filterContacts();
	},

	filterContacts() {
		return this.all.filter(obj => {
			return matchTags(obj) && matchQuery(obj)
		});
	},

	matchTags(obj) {
		const tags = obj.tags || 'not-tagged';
		return tags.split(',').every(tag => this.tagsChecked.includes(tag));
	},

	matchQuery(obj) {
		const regexStartWithQuery = new RegExp('^' + this.queryInput, 'i');
		return obj.full_name.match(regexStartWithQuery);
	},
},

Template.init();
Contacts.init();
App.init();
});