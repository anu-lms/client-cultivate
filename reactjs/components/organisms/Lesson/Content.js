import Debug from 'debug';
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Alert from 'react-s-alert';
import Paragraphs from '../../atoms/Paragraph';
import Button from '../../atoms/Button';
import LessonNotebookOpenCTA from '../../atoms/LessonNotebookOpenCTA';
import { Link, Router } from '../../../routes';
import * as lessonActions from '../../../actions/lesson';
import * as lessonHelpers from '../../../helpers/lesson';
import * as courseActions from '../../../actions/course';
import * as courseHelpers from '../../../helpers/course';
import * as lock from '../../../utils/lock';
import * as mediaBreakpoint from '../../../utils/breakpoints';
import * as navigationActions from '../../../actions/navigation';
import * as lessonSidebarActions from '../../../actions/lessonSidebar';

const debug = Debug('anu:lesson');

class LessonContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isSending: false,
    };

    // List of paragraphs ids from this lesson which have to report to this
    // component that they have been loaded.
    this.paragraphsToLoad = [];

    this.openSidebar = this.openSidebar.bind(this);

    // Method is responsible for handling lesson read progress.
    this.updateReadProgress = this.updateReadProgress.bind(this);

    // These methods handle loading of paragraphs on the page.
    this.updateParagraphsList = this.updateParagraphsList.bind(this);
    this.handleParagraphLoaded = this.handleParagraphLoaded.bind(this);

    // Method is being invoked on each quiz update.
    this.handleQuizChange = this.handleQuizChange.bind(this);

    // Quizzes submit handling methods.
    this.submitAssessment = this.submitAssessment.bind(this);
    this.submitQuizzesAndRedirect = this.submitQuizzesAndRedirect.bind(this);
  }

  componentWillMount() {
    this.updateParagraphsList(this.props);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateReadProgress);
    window.addEventListener('scroll', this.updateReadProgress);

    // When component is mounted, send action that the lesson is opened.
    // It should trigger background sync of lesson progress.
    this.props.dispatch(lessonActions.opened(this.props.lesson));
  }

  componentWillUpdate(nextProps) {
    // Gather list of paragraphs once per lesson page load.
    if (nextProps.lesson.id !== this.props.lesson.id) {
      this.updateParagraphsList(nextProps);

      // Send action that the previous lesson is closed and the new one
      // is opened.
      this.props.dispatch(lessonActions.closed(this.props.lesson));
      this.props.dispatch(lessonActions.opened(nextProps.lesson));
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateReadProgress);
    window.removeEventListener('scroll', this.updateReadProgress);

    // When component is being unmounted, send action that the lesson is closed.
    // It should stop background sync of lesson progress.
    this.props.dispatch(lessonActions.closed(this.props.lesson));
  }

  updateReadProgress() {
    // It's important to wait for the whole page to load before we can
    // start relying on container's height.
    if (this.paragraphsToLoad.length > 0) {
      debug('updateReadProgress(paragraphsToLoad > 0)', this.paragraphsToLoad);
      return;
    }

    const { storeLessons, lesson, course } = this.props;

    const readThrough = window.pageYOffset + window.innerHeight;
    const pageHeight = document.body.offsetHeight;

    const progress = readThrough >= pageHeight ? 100 : (readThrough / pageHeight) * 100;

    const existingProgress = lessonHelpers.getProgress(storeLessons, lesson);
    debug('updateReadProgress', { readThrough, pageHeight, progress, existingProgress });
    if (progress > existingProgress) {
      this.props.dispatch(lessonActions.setProgress(lesson.id, progress));

      const index = storeLessons.findIndex(element => element.id === lesson.id);
      if (index !== -1) {
        storeLessons[index].progress = progress;
      }
      else {
        storeLessons.push({ id: lesson.id, progress });
      }

      const courseProgress = courseHelpers.calculateProgress(storeLessons, course.lessons);
      this.props.dispatch(courseActions.setProgress(course.id, courseProgress));
    }
  }

  /**
   * We gather list of paragraphs available on the current lesson page.
   * It's needed to require each paragraph to report back that it's loaded.
   * When all paragraphs will be loaded - we can calculate the lesson progress
   * by getting the accurate page height.
   */
  updateParagraphsList(props) {
    // Clear paragraphs list.
    this.paragraphsToLoad = [];

    // Mark all blocks as "needs to be loaded".
    props.lesson.blocks.forEach(block => {
      this.paragraphsToLoad.push(block.id);

      // Handle nested blocks.
      if (typeof block.blocks !== 'undefined') {
        block.blocks.forEach(subblock => {
          this.paragraphsToLoad.push(subblock.id);
        });
      }
    });
  }

  /**
   * We require every paragraph to report that it's content was loaded.
   * It is necessary to precisely calculate page read progress without having
   * to rely on timeouts or being dependant from other data loading stuff.
   */
  handleParagraphLoaded(paragraphId) {
    debug('handleParagraphLoaded', paragraphId);
    const index = this.paragraphsToLoad.findIndex(id => id === paragraphId);
    if (index !== -1) {
      this.paragraphsToLoad.splice(index, 1);
      if (!this.paragraphsToLoad.length) {
        this.updateReadProgress();
      }
    }
  }

  /**
   * Reflects each change in quiz.
   * Being executed from inside of the quiz component.
   */
  handleQuizChange(quizId, quizValue) {
    const { lesson } = this.props;
    this.props.dispatch(lessonActions.setQuizResult(lesson.id, quizId, quizValue));
  }

  /**
   * Handle click on "Submit Assessment" button.
   */
  async submitAssessment() {
    const result = await this.submitQuizzes();
    if (result) {
      Alert.success('Thank you, the assessment has been successfully submitted.');
    }
    else {
      Alert.error('We could not submit your assessment. Please, contact site administrator.');
    }
  }

  /**
   * Handle click on "Submit and Continue" button.
   */
  async submitQuizzesAndRedirect() {
    const { lesson, course } = this.props;
    const nextLesson = lessonHelpers.getNextLesson(course.lessons, lesson.id);

    const result = await this.submitQuizzes();
    if (result) {
      Alert.success('Thank you, the quizzes have been successfully submitted.');
      if (nextLesson) {
        Router.pushRoute(nextLesson.url).then(() => window.scrollTo(0, 0));
      }
    }
    else {
      Alert.error('We could not submit your data. Please, contact site administrator.');
    }
  }

  /**
   * Submit all quizzes within lesson to the backend.
   */
  async submitQuizzes() {
    const { lesson, quizzesData, dispatch } = this.props;

    this.setState({ isSending: true });

    console.log('Submitting data:');
    console.log(quizzesData);

    // Lock logout until post operation is safely completed.
    const lockId = lock.add('quizzes-save');

    // Get superagent request with authentication.
    const { request } = await this.context.auth.getRequest();

    try {
      const tokenResponse = await request.get('/session/token');

      await request
        .post('/quizzes/results?_format=json')
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', tokenResponse.text)
        .send({
          lessonId: lesson.id,
          quizzes: quizzesData,
        });

      this.setState({ isSending: false });

      // Mark the current lesson quizzes as saved on the backend.
      dispatch(lessonActions.setQuizzesSaved(lesson.id));

      lock.release(lockId);
      return true;
    }
    catch (error) {
      console.error('Error during quizzes saving.', error);

      this.setState({ isSending: false });

      lock.release(lockId);
      return false;
    }
  }

  /**
   * Performs actions when sidebar is being opened.
   */
  openSidebar() {
    const { dispatch } = this.props;

    // Let the application now that the notebook is being opened.
    dispatch(lessonSidebarActions.open());

    // If sidebar is opened, close navigation pane on all devices except extra
    // large.
    if (mediaBreakpoint.isDown('xxl')) {
      dispatch(navigationActions.close());
    }
  }

  render() {
    const { lesson, course, navigation, lessonNotebook, quizzesSaved } = this.props;
    const nextLesson = lessonHelpers.getNextLesson(course.lessons, lesson.id);

    let buttons = [];

    // Add an extra button for assessments.
    if (lessonHelpers.isAssessment(lesson) && !quizzesSaved) {
      buttons.push((
        <Button type="link" key="assessment" block onClick={this.submitAssessment} loading={this.state.isSending}>
          Submit Assessment
        </Button>));
    }

    // For lesson with quizzes we change default Next button to
    // "Submit and Continue" button.
    if (!lessonHelpers.isAssessment(lesson) && lessonHelpers.hasQuizzes(lesson)) {
      buttons.push((
        <Button type="link" key="next" block onClick={this.submitQuizzesAndRedirect} loading={this.state.isSending}>
          {nextLesson &&
            <Fragment>Submit and Continue</Fragment>
          }
          {!nextLesson &&
            <Fragment>Submit</Fragment>
          }
        </Button>));
    }
    else if (nextLesson) {
      buttons.push((
        <Link to={nextLesson.url} key="next" prefetch>
          <a className="btn btn-primary btn-lg btn-block">
              Next: {nextLesson.title}
          </a>
        </Link>));
    }

    let wrapperClasses = ['lesson-container'];
    let columnClasses = ['col-12'];

    // Defines classes if navigation opened.
    if (navigation.isCollapsed) {
      wrapperClasses.push('nav-collapsed');
    }
    // Defines classes if notebook opened.
    if (lessonNotebook.isCollapsed) {
      wrapperClasses.push('notebook-collapsed');
      columnClasses.push('offset-md-1');
      columnClasses.push('col-md-10');
      columnClasses.push('offset-lg-2');
      columnClasses.push('col-lg-8');
    }
    else {
      columnClasses.push('offset-xl-2');
      columnClasses.push('col-xl-8');
    }
    return (
      <div className={wrapperClasses.join(' ')}>

        <div className="container">
          <div className="row">
            <div className={columnClasses.join(' ')}>
              <h1>{lesson.title}</h1>
            </div>
          </div>
        </div>

        <div className="lesson-content" ref={element => this.container = element}>
          <Paragraphs
            lessonId={lesson.id}
            blocks={lesson.blocks}
            handleQuizChange={this.handleQuizChange}
            handleParagraphLoaded={this.handleParagraphLoaded}
            columnClasses={columnClasses}
          />
        </div>

        {lessonNotebook.isCollapsed &&
          <LessonNotebookOpenCTA onClick={this.openSidebar} />
        }

        <div className="lesson-navigation container">
          <div className="row">
            <div className={columnClasses.join(' ')}>
              {buttons}
            </div>
          </div>
        </div>

      </div>
    );
  }
}

const mapStateToProps = (store, ownProps) => ({
  quizzesData: lessonHelpers.getQuizzesData(store.lesson, ownProps.lesson.id),
  quizzesSaved: lessonHelpers.areQuizzesSaved(store.lesson, ownProps.lesson.id),
  navigation: store.navigation,
  storeLessons: store.lesson,
  lessonNotebook: store.lessonNotebook,
});

LessonContent.contextTypes = {
  auth: PropTypes.shape({
    getRequest: PropTypes.func,
  }),
};

LessonContent.propTypes = {
  storeLessons: PropTypes.arrayOf(PropTypes.object).isRequired,
  course: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  lesson: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  navigation: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  lessonNotebook: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  quizzesData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  quizzesSaved: PropTypes.bool.isRequired, // eslint-disable-line react/forbid-prop-types
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(LessonContent);
