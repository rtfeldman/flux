/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoStore
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var TodoConstants = require('../constants/TodoConstants');
var assign = require('object-assign');

var CHANGE_EVENT = 'change';


var _todos = {};

var TodoStore = assign({}, EventEmitter.prototype, {

  /**
   * Tests whether all the remaining TODO items are marked as completed.
   * @return {boolean}
   */
  areAllComplete: function() {
    for (var id in _todos) {
      if (!_todos[id].complete) {
        return false;
      }
    }
    return true;
  },

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */
  getAll: function() {
    return _todos;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

var defaultValues = {
  dispatchCreate: "",
  dispatchComplete: 0,
  dispatchDestroy: 0,
  dispatchDestroyCompleted: [],
  dispatchToggleCompleteAll: [],
  dispatchUndoComplete: 0,
  dispatchUpdateText: [0, ""]
};

var ports = Elm.worker(Elm.TodoStore, defaultValues).ports;

ports.todoListChanges.subscribe(function(updatedTodoList) {
  // Convert from the flat list we're using in Elm
  // to the keyed-by-id object the JS code expects.
  _todos = {};

  updatedTodoList.forEach(function(item) {
    _todos[item.id] = item;
  });

  TodoStore.emitChange();
});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
  var text;

  switch(action.actionType) {
    case TodoConstants.TODO_CREATE:
      ports.dispatchCreate.send(action.text);
      break;

    case TodoConstants.TODO_TOGGLE_COMPLETE_ALL:
      ports.dispatchToggleCompleteAll.send([]);
      break;

    case TodoConstants.TODO_UNDO_COMPLETE:
      ports.dispatchUndoComplete.send(action.id);
      break;

    case TodoConstants.TODO_COMPLETE:
      ports.dispatchComplete.send(action.id);
      break;

    case TodoConstants.TODO_UPDATE_TEXT:
      ports.dispatchUpdateText.send([action.id, action.text]);
      break;

    case TodoConstants.TODO_DESTROY:
      ports.dispatchDestroy.send(action.id);
      break;

    case TodoConstants.TODO_DESTROY_COMPLETED:
      ports.dispatchDestroyCompleted.send([]);
      break;

    default:
      // no op
  }
});

module.exports = TodoStore;
