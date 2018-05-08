<?php

namespace Drupal\anu_events\Event;

use Drupal\message\Entity\Message;
use \Drupal\Component\Render\FormattableMarkup;


class ReplyToCommentEvent extends AnuEvent {

  protected $recipient;

  protected $triggerer;

  public function __construct($entity, $template_name = '') {
    parent::__construct($entity, AnuEvents::REPLY_TO_COMMENT,'reply_to_comment');
  }

  public function canBeTriggered() {
    return $this->getTriggerer() !== $this->getRecipient();
  }

  public function getTriggerer() {
    if (empty($this->triggerer)) {
      $this->triggerer = (int) $this->entity->uid->target_id;
    }
    return $this->triggerer;
  }

  public function getRecipient() {
    if (empty($this->recipient)) {
      $this->recipient = (int) $this->entity->field_comment_parent
        ->first()
        ->get('entity')
        ->getValue()
        ->uid
        ->target_id;
    }
    return $this->recipient;
  }

  public function createMessage() {
    try {
      $comment = $this->entity;

      /** @var \Drupal\message\Entity\Message $message */
      $message = Message::create([
        'template' => $this->template_name,
        'uid' => $this->getTriggerer(),
      ]);
      $message->field_message_comment = $comment->id();
      $message->field_message_recipient = $this->getRecipient();
      $saved_status = $message->save();

      $this->setMessage($message);

      return $saved_status == SAVED_NEW;
    }
    catch (\Exception $exception) {
      $message = new FormattableMarkup('Could not create a message for comment @id. Error: @error', [
        '@id' => $comment->id(),
        '@error' => $exception->getMessage()
      ]);
      \Drupal::logger('anu_events')->error($message);
    }

    return FALSE;
  }

}
