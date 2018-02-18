import React, { Fragment } from 'react';
import PasswordForm from '../../moleculas/Form/Password';
import { connect } from 'react-redux';
import { Router } from "../../../routes";
import OneColumnLayout from '../../../components/organisms/Templates/OneColumnLayout';

class ForgotPassword extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const {  } = this.props;

    return (
      <OneColumnLayout pageTitle="Forgot Password?">
        <PasswordForm/>
      </OneColumnLayout>
    );
  }
}

export default ForgotPassword;
