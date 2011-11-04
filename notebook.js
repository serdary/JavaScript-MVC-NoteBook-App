// Event listener -- observer pattern
// Models should notify the related views when a change occured on the model
// Use this class to add events, attach observers to related events, 
// and notify the attached observers with parameters for the specified event
var EventObserver = function(events) {
	var _eventObservers = {};
	
	// checks if the event is registered
	var isEventAvailable = function(event) {
		return _eventObservers.hasOwnProperty(event);
	};
	
	// returns the attached observers for the event
	var getEventObservers = function(event) {
		if (! isEventAvailable(event)) {
			return [];
		}
		
		return _eventObservers[event];
	};
	
	// adds an event if it is not added before
	var addEvent = function(event) {
		if (isEventAvailable(event)) {
			return;
		}
		
		_eventObservers[event] = [];
	};
	
	// adds batch events
	var addEvents = function(events) {
		for (var i = 0; i < events.length; i++) {
			addEvent(events[i]);
		}
	};
	
	// notifies the attached observers to the event with data param
	var notify = function(event, data) {		
		var existingObservers = getEventObservers(event);
		
		for (var i = 0; i < existingObservers.length; i++) {
			existingObservers[i](data);
		}
	};
	
	// attaches an observer to the event if it is not already attached
	var attach = function(event, observer) {
		if (! isEventAvailable(event)) {
			return;
		}
		
		var existingObservers = getEventObservers(event);
		var observerAvailable = false;
		for (var i = 0; i < existingObservers.length; i++) {
			if (existingObservers[i] === observer) {
				observerAvailable = true;
			}
		}
		
		// attach the observer if it is not attached before
		if (! observerAvailable) {
			existingObservers.push(observer);
		}
	};
	
	// adds the events if it is defined while creating instance
	addEvents(events);
	
	return {
		// public method for notifying the observers
		notifyObservers: function(event, data) {
			notify(event, data);
		},
		
		// public method for attaching new observers to the event
		attachObserver: function(event, observer) {
			attach(event, observer);
		}
	};
}

// note model
var Note = function(content) {
	// private vars
	var _id;
	var _content = content;
		
	// setter
	var setId = function(id) {
		_id = id;
	};
	
	return {
		// getters
		getId: function() {
			return _id;
		},
		
		getContent: function() {
			return _content;
		},
		
		// saves the current note
		save: function() {
			// all model validations goes here
			if (_content === undefined || _content === '') {
				return false;
			}
			/*
			Make an ajax call to server, save the note and get id, i.e.:
			$.ajax({
				url: 'note/create',
				type: 'post',
				async: false,
				datatype: 'json',
				data: 'content=' + this.getContent(),
				success: function(data) {
					if (data !== undefined && typeof data.id === 'number') {
						setId(data.id);
					}
				},
				error: function(data) {
					setId(-1);
				}
			});
			*/
		},
		
		// removes the note, returns the result
		remove: function() {
			// make an ajax call to server and return the result of the remove action
		},
		
		// used for testing the app without tiding an actual db, identifiers are set by externally from the list
		saveDummy: function(dummyAutoId) {
			if (_content === undefined || _content === '') {
				setId(-1);
				return false;
			}
			
			setId(dummyAutoId);
			return true;
		},
		
		// removes the note, returns the result
		removeDummy: function() {
			setId(-1);
			return true;
		},
		
		toString: function() {
			return 'id: ' + this.getId() + ', content: ' + this.getContent();
		}
	};
};

// note list model -- used to store a list of user's notes
// adds/removes notes to/from note list.
var NoteList = function() {
	var _list = [];
	// add the events which will be used to attach and notify observers
	var _eventObservers = EventObserver(['noteAdd', 'noteRemove']);
	
	// This variable is used to provide an auto PK id to notes, in a production app, notes will be actually saved and
	// ids will be handled by dynamically.
	var _autoId = 1; // TODO: delete!
	
	// returns the note index if it is found in the list
	var getNoteIndex = function(note) {
		var index = -1;
		for (var i = 0; i < _list.length; i++) {
			if (_list[i].getId() === note.getId()) {
				index = i;
				break;
			}
		}
		return index;
	};
	
	return {
		// getter for the list
		getList: function() {
			return _list;
		},
		
		// adds a note to the list
		addNote: function(note) {
			var result = note.saveDummy(_autoId++); // use save() method here on a production app.
			var data;
			if (result) {
				_list.push(note);
				data = [note, note.getContent() + ' is saved.'];
			}
			else {
				data = [note, 'note is not saved.'];
			}
			
			// notify all the attached observers for noteAdd event with data parameter
			_eventObservers.notifyObservers('noteAdd', data);
		},
		
		// removes a note from list
		removeNote: function(note) {
			var index = getNoteIndex(note);
			var noteId = note.getId(), data;
			
			// if note is found in the list
			if (index > -1) {
				// note: use remove() method instead dummy one.
				if (note.removeDummy()) {
					_list.splice(index, 1);
					data = [noteId, note.getContent() + ' is removed.'];
				}
				else {
					data = [-1, note.getContent() + ' is not removed, error!'];
				}
			}
			else {
				data = [-1, 'note is not found.'];
			}
			
			// notify all the attached observers for noteRemove event with data parameter
			_eventObservers.notifyObservers('noteRemove', data);
		},
		
		// used to attach an observer to an event
		attachObserver: function(event, observer) {
			_eventObservers.attachObserver(event, observer);
		},
		
		toString: function() {
			var listStr;
			for (var i = 0; i < _list.length; i++) {
				listStr += 'Index: ' + i + ', note: ' + _list[i].toString();
			}
			return listStr;
		},
		
		// adds dummy notes to the list -- used to test the listing feature
		addDummyNotes: function(limit) {
			var note;
			for (var i = 0; i < limit; i++) {
				note = Note('dummy note-' + (i+1));
				this.addNote(note);
			}
		}
	};
}

// list view -- used to display the list of notes, and observes the add/remove notifications
// called when a new "add" or "remove" event occured.
var NoteListView = function(noteList, noteController) {
	// creates a new note element for the note object
	var createNoteElement = function(note) {
		var noteElement = document.createElement('div');
		noteElement.id = 'note-' + note.getId();
		
		// contains note content
		var content = document.createElement('label');
		content.innerHTML = note.getContent();
		noteElement.appendChild(content);
		
		// used to remove feature
		var removeLink = document.createElement('a');
		removeLink.href = '#remove';
		removeLink.innerHTML = 'remove';
		removeLink.addEventListener('click', function(e) {
			e.preventDefault();
			noteController.handleRemoveEvent(note, noteList);
		}, false);
		noteElement.appendChild(removeLink);
		
		return noteElement;
	};
	
	// empties list wrapper and displays all of the user's notes.
	// if user has no notes, then displays a warning message
	var displayAllNotes = function() {
		var listWrapper = document.getElementById('list_wrapper');
		// empty the list wrapper before loading new elements
		listWrapper.innerHTML = '';
		
		var list = noteList.getList();
		if (list.length < 1) {
			listWrapper.innerHTML = 'You don\'t have any notes yet. Try adding a new one.';
			return;
		}
		
		for (var i = 0; i < list.length; i++) {
			listWrapper.appendChild(createNoteElement(list[i]));
		}
	};
	
	// called from EventObserver class when user removed a note from the list
	// gets data from model, removes the note if it is removed successfully
	// adds a feedback message to browser
	var updateListAfterRemoving = function(data) {
		if (parseInt(data[0]) > -1) {
			var child = document.getElementById('note-' + data[0]);
			var parent = document.getElementById('list_wrapper');
			parent.removeChild(child);
		}
		document.getElementById('message').innerHTML = data[1];
		
		if (noteList.getList().length < 1) {
			document.getElementById('list_wrapper').innerHTML = 'You don\'t have any notes yet. Try adding a new one.';
		}
	};
	
	// called from EventObserver class when user added a note to the list
	// gets data from model, adds the note to the end of the list, if it is added successfully
	// adds a feedback message to browser
	var updateListAfterAdding = function(data) {
		if (noteList.getList().length < 2) {
			document.getElementById('list_wrapper').innerHTML = '';
		}
		
		if (data[0].getId() > -1) {
			document.getElementById('list_wrapper').appendChild(createNoteElement(data[0]));
		}
		document.getElementById('message').innerHTML = data[1];
	};
	
	// attach add and remove observers for the related events
	noteList.attachObserver('noteAdd', updateListAfterAdding);
	noteList.attachObserver('noteRemove', updateListAfterRemoving);
	
	return {
		// a public method to display the whole note list
		displayList: function() {
			displayAllNotes();
		}
	};
};

// Note Add Form View class. Displays an "add note form", adds a valid note asynchronously
var NoteAddView = function(noteList, noteController) {
	return {
		// displays the add form
		displayForm: function() {
			var addForm = document.createElement('form');
			addForm.action = '#add';
			
			// textbox for note content
			var textboxElement = document.createElement('input');
			textboxElement.type = 'input';
			textboxElement.id = 'note_textbox';
			addForm.appendChild(textboxElement);
			
			// submit button for the add form
			var addButton = document.createElement('input');
			addButton.type = 'submit';
			addButton.value = 'add note';
			addButton.addEventListener('click', function(e) {
				e.preventDefault();
				noteController.handleAddEvent(textboxElement.value, noteList);
			}, false);
			addForm.appendChild(addButton);
			
			document.getElementById('new_note_wrapper').appendChild(addForm);
		}
	};
};

// Displays note list and handles the note add and remove event.
var NoteController = function() {	
	return {
		// handles the add event when a new form is submitted
		// creates a new note instnace and add to the notelist if it is valid
		handleAddEvent: function(content, noteList) {
			var note = Note(content);
			noteList.addNote(note);
		},
		
		// handles the remove event when user click the remove button
		// gets the note as param, remove it from the list
		handleRemoveEvent: function(note, noteList) {
			noteList.removeNote(note);
		},
		
		// triggered from webpage. Creates an empty list, shows add form and the note list to user.
		displayNoteList: function() {
			var noteList = NoteList();
			//noteList.addDummyNotes(10);
			
			var noteAddView = NoteAddView(noteList, this);
			noteAddView.displayForm();
			
			var noteListView = NoteListView(noteList, this);
			noteListView.displayList();
		}
	};
};