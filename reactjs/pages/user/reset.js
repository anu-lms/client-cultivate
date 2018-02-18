import React, { Component } from 'react';
import { connect } from 'react-redux';
import App from '../../application/App';
import withAuth from '../../auth/withAuth';
import Header from '../../components/organisms/Header';
import ForgotPassword from '../../components/organisms/Password/Forgot';
import ResetPassword from '../../components/organisms/Password/Reset';

class ForgotPasswordPage extends Component {
  static skipAuthRedirect = true;

  render() {
    return (
      <App>
        <Header isEmpty={true}/>
        <div className="page-with-header page-reset-password">
          {!this.props.url.query.uid &&
            <ForgotPassword />
          }
          {this.props.url.query.uid &&
            <ResetPassword />
          }
        </div>
      </App>
    );
  }

  static async getInitialProps({ request, query, res }) {
    console.log(query);
    let initialProps = {
    };

    return initialProps;
  }
}

export default withAuth(ForgotPasswordPage);
