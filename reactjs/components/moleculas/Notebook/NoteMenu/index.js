import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Alert from 'react-s-alert';
import Dropdown, { ImportantMenuItem, MenuIcon, DeleteIcon } from '../../../atoms/DropdownMenu';
import * as notebookActions from '../../../../actions/notebook';
import * as notebookApi from '../../../../api/notebook';
import * as lock from '../../../../utils/lock';

class NoteMenu extends Component {
  async onDelete() {
    const { note, dispatch, sessionToken } = this.props;

    if (window.confirm('Delete this note?')) { // eslint-disable-line no-alert
      // Lock logout until delete operation is safely completed.
      const lockId = lock.add('notebook-delete-note');

      // Hide the note immediately after confirmation.
      dispatch(notebookActions.deleteNote(note.id));

      // Make DELETE request.
      try {
        // Get superagent request with authentication.
        const { request } = await this.context.auth.getRequest();

        request.set('X-CSRF-Token', sessionToken);

        // Sending backend request to remove the note.
        await notebookApi.deleteNote(request, note.uuid);

        // Go back to the list of notes on mobile.
        dispatch(notebookActions.toggleMobileVisibility());
      }
      catch (error) {
        console.log(error);
        Alert.error('Could not delete the note. Please reload the page and try again.');
      }

      lock.release(lockId);
    }
  }

  render() {
    return (
      <Dropdown>
        <Dropdown.Toggle
          noCaret
          btnStyle="link"
        >
          <MenuIcon />
        </Dropdown.Toggle>
        <Dropdown.MenuWrapper pullRight>
          <Dropdown.Menu pullRight>
            <ImportantMenuItem onSelect={() => { this.onDelete(); }} >
              <DeleteIcon /> Delete Note
            </ImportantMenuItem>
          </Dropdown.Menu>
        </Dropdown.MenuWrapper>
      </Dropdown>
    );
  }
}

NoteMenu.contextTypes = {
  auth: PropTypes.shape({
    getRequest: PropTypes.func,
  }),
};

const mapStateToProps = ({ user }) => ({
  sessionToken: user.sessionToken,
});

export default connect(mapStateToProps)(NoteMenu);
