import * as dataProcessors from '../utils/dataProcessors';

/**
 * Make a request to the backend to get user notifications.
 */
export const fetchNotifications = (request, isRead) => new Promise((resolve, reject) => {
  const query = {};

  if (isRead !== undefined) {
    query.isRead = isRead ? 1 : 0;
  }
  request
    .get('/notifications?_format=json')
    .query(query)
    .then(response => {
      resolve(dataProcessors.processNotifications(response.body));
    })
    .catch(error => {
      console.log('Could not fetch notifications.', error);
      reject(error);
    });
});

/**
 * Make a request to the backend to get user notifications.
 */
export const markAllAsRead = request => new Promise((resolve, reject) => {
  request
    .get('/notifications?_format=json')
    .then(() => {
      resolve();
    })
    .catch(error => {
      console.log('Could not fetch notifications.', error);
      reject(error);
    });
});

/**
 * Make a request to the backend to get user notifications.
 */
export const markAsRead = (request, bundle, uuid) => new Promise((resolve, reject) => {
  request
    .patch(`/jsonapi/message/${bundle}/${uuid}`)
    .send({
      data: {
        type: `message--${bundle}`,
        id: uuid,
        attributes: {
          field_message_is_read: true,
        },
      },
    })
    .then(() => {
      resolve();
    })
    .catch(error => {
      console.log('Could not mark notification as read.', error);
      reject(error);
    });
});
