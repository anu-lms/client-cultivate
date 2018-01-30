export default (state = [], action) => {

  let index;
  let lesson;

  //return [];

  switch (action.type) {
    case 'LESSON_PROGRESS_SET':

      // Search for the lesson.
      index = state.findIndex(element => element.id === action.lessonId);

      // If the lesson was found, then we should update it.
      if (index !== -1) {
        lesson = state[index];

        // Never let the progress go back.
        if (action.progress > lesson.progress) {
          lesson.progress = action.progress;
        }

        return [
          ...state.slice(0, index),
          lesson,
          ...state.slice(index + 1)
        ];
      }

      // If lesson didn't exist before - simply add it.
      return [
        ...state,
        {
          id: action.lessonId,
          progress: action.progress,
        }
      ];

    default:
      return state;
  }
};