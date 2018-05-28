import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import NotificationItem from '../Item';
import { Router } from '../../../../routes';
import * as userHelper from '../../../../helpers/user';
import * as notificationActions from '../../../../actions/notifications';

export const supportedBundles = [
  'add_comment_to_thread',
  'reply_to_comment',
];

const NotificationCommentItemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <g fill="none" fillRule="evenodd">
      <path fill="#B2B2B2" fillRule="nonzero" d="M19.99 2c0-1.1-.89-2-1.99-2H2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
      <path d="M-2-2h24v24H-2z" />
    </g>
  </svg>
);

class NotificationCommentItem extends React.Component {
  constructor(props) {
    super(props);
    this.onTitleClick = this.onTitleClick.bind(this);
    this.onItemClick = this.onItemClick.bind(this);
  }

  onTitleClick() {
    const { notificationItem, closePopup } = this.props;
    if (notificationItem.comment.url) {
      Router.replaceRoute(notificationItem.comment.url);
      closePopup();
    }
  }

  onItemClick() {
    const { notificationItem, dispatch } = this.props;

    if (!notificationItem.isRead) {
      dispatch(notificationActions.markAsRead(notificationItem.id));
      dispatch(notificationActions.markAsReadInStore(notificationItem.id));
    }
  }

  render() {
    const { triggerer, comment, created, bundle, isRead } = this.props.notificationItem;
    const { lessonTitle, text } = comment;
    const triggererName = userHelper.getUsername(triggerer);
    let titleCopy = 'replied to your comment in';
    if (bundle === 'add_comment_to_thread') {
      titleCopy = 'commented in your thread in';
    }

    return (
      <NotificationItem
        Icon={NotificationCommentItemIcon}
        date={created}
        title={`<strong>${triggererName}</strong> ${titleCopy} <strong>${lessonTitle}</strong>`}
        text={text}
        className={`comment comment-${bundle}`}
        isRead={isRead}
        onTitleClick={this.onTitleClick}
        onItemClick={this.onItemClick}
      />
    );
  }
}

NotificationCommentItem.propTypes = {
  dispatch: PropTypes.func.isRequired,
  notificationItem: PropTypes.shape({
    id: PropTypes.number,
    bundle: PropTypes.string,
    created: PropTypes.number,
    triggerer: PropTypes.object,
    isRead: PropTypes.bool,
    comment: PropTypes.shape({
      id: PropTypes.string,
      text: PropTypes.string,
      url: PropTypes.string,
      paragraphId: PropTypes.number,
      lessonTitle: PropTypes.string,
    }),
  }).isRequired,
  closePopup: PropTypes.func,
};

NotificationCommentItem.defaultProps = {
  closePopup: () => {},
};

export default connect()(NotificationCommentItem);
