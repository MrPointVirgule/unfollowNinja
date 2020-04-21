import React from 'react';
import {Box, Button, Paragraph} from "grommet/es6";
import {Alert, Twitter, ChatOption, UserExpert, Validate} from "grommet-icons";
import { useHistory, useLocation } from "react-router-dom";
import Confetti from 'react-dom-confetti';
import { useQuery, useMutation, gql } from '@apollo/client';

import Styles from './MiniApp.module.scss';
import Link from "./Link";

const GET_INFO = gql`
    {
        info {
            id,
            twitterStep1AuthUrl,
            twitterStep2AuthUrl,
            user {id, username, dmUsername, category}
        }
    }
`;

const LOGIN = gql`
    mutation Login($oauthToken: String!, $oauthVerifier: String!) {
        login(token: $oauthToken, verifier: $oauthVerifier) {
            id,
            twitterStep1AuthUrl,
            twitterStep2AuthUrl,
            user {id, username, dmUsername, category}
        }
    }
`;

const ADD_DMS = gql`
    mutation AddDms($oauthToken: String!, $oauthVerifier: String!) {
        addDmAccount(token: $oauthToken, verifier: $oauthVerifier) {id, username, dmUsername}
    }
`;

const REMOVE_DMS = gql`
    mutation RemoveDms {
        removeDmAccount {id, username, dmUsername, category}
    }
`;

const LOGOUT = gql`
    mutation Logout {
        logout {
            id,
            twitterStep1AuthUrl,
            twitterStep2AuthUrl,
            user {id, username, dmUsername, category}
        }
    }
`;

const LoggedInIntro = ({ user, logout, removeDMs }) => {
    if (!user) return null; // not logged in

    let message = <Paragraph>One more step to activate the service:<br/> Choose an account to send you notifications</Paragraph>;
    if (user.category === 2) { // revoked tokens
        message = <Paragraph>It seems that your Twitter account has been deactivated:<br/> Log in again to reactivate the service.</Paragraph>;
    }
    if (user.dmUsername) {
        message = <Paragraph>All clear! Don't forget to follow <Link href='https://twitter.com/unfollowmonkey' source='logged-in-intro'>@unfollowMonkey</Link></Paragraph>;
    }
    if (user.dmUsername && user.dmUsername !== user.username) {
        message = <Paragraph>All clear, <b>@{user.dmUsername}</b> will notify you by DM!
            Don't forget to follow <Link href='https://twitter.com/unfollowmonkey' source='logged-in-intro'>@unfollowMonkey</Link></Paragraph>;
    }
    return <div className={Styles.loggedInDetails}>
        <Paragraph><Validate color='neutral-1' className={Styles.centerIcon}/> Welcome, <b>@{user.username}</b> !</Paragraph>
        {message}
        <Paragraph>
            <Link href='#' onClick={e => {logout();e.preventDefault();}} source='disconnect'>Log out</Link>
            {user.dmUsername ? <span> — <Link href='#' onClick={e => {removeDMs();e.preventDefault();}} source='disable'>Disable the service</Link>
            </span> : null}
        </Paragraph>
    </div>
};

function sendStep3Event() {
    if (window.gtag) {
        window.gtag('event', 'click', {
            'event_category': 'outbound',
            'event_label': 'step 3',
        });
    }
}

function MiniApp(props) {
  const location = useLocation();
  const history = useHistory();


    const [login, loginRequest] = useMutation(LOGIN);
  const [addDms, addDmsRequest] = useMutation(ADD_DMS);
  const [removeDMs] = useMutation(REMOVE_DMS);
  const [logout] = useMutation(LOGOUT);
  let { error, data, refetch } = useQuery(GET_INFO);
  data = data?.info;
  error = error || loginRequest.error || addDmsRequest.error;
  if (navigator.userAgent === 'ReactSnap') {
      data = null; // ReactSnap should capture a loading state
  }

  if (!loginRequest.called && location.pathname === '/1') {
    const urlParams = new URLSearchParams(location.search);
    const [ oauthToken, oauthVerifier ] = [ urlParams.get('oauth_token'), urlParams.get('oauth_verifier') ];
    if (oauthToken && oauthVerifier) { // otherwise, probably denied
        login({variables: {oauthToken, oauthVerifier}});
        setTimeout(() => window.gtag && window.gtag('event', 'login'), 1000); // ganalaytics
    } else {
        setTimeout(() => window.gtag && window.gtag('event', 'exception', {description: 'login_failed'}), 1000);
    }
    history.push('/');
  } else if (!addDmsRequest.called && location.pathname === '/2') {
      const urlParams = new URLSearchParams(location.search);
      const [ oauthToken, oauthVerifier ] = [ urlParams.get('oauth_token'), urlParams.get('oauth_verifier') ];
      if (oauthToken && oauthVerifier) { // otherwise, probably denied
          addDms({variables: {oauthToken, oauthVerifier}});
          setTimeout(() => window.gtag && window.gtag('event', 'sign_up'), 1000); // ganalaytics
      } else {
          setTimeout(() => window.gtag && window.gtag('event', 'exception', {description: 'add_dms_failed'}), 1000);
      }
      history.push('/');
  }

  const step0 = !data?.user && !addDmsRequest.loading && !loginRequest.loading; // not logged in or loading
  const step1 = data?.user && !data.user.dmUsername; // logged in but no DM account
  const step2 = !!data?.user?.dmUsername; // logged in and have a DM account

  return (
      <Box gap='small' margin={{horizontal: 'small', vertical: 'medium'}} {...props}>
        {error ? <Paragraph textAlign='center'><Alert/><br/>Unable to reach the server, try again later...</Paragraph> : null}
        <Confetti active={step2} className={Styles.confettis}/>
        <LoggedInIntro user={data?.user} logout={logout} removeDMs={removeDMs} getInfo={refetch}/>
        <Button
            icon={<Twitter color={step0 ? 'white' : null}/>}
            label='Login to your account'
            primary={step0}
            style={step0 ? {color: 'white'} : {}}
            disabled={!data?.twitterStep1AuthUrl || !step0}
            href={data?.twitterStep1AuthUrl}
        />
        <Button
            icon={<ChatOption color={step1 ? 'white' : null}/>}
            label={step2 ? 'Changing the DMs sending account' : 'Enable DM notifications'}
            primary={step1}
            style={step1 ? {color: 'white'} : {}}
            disabled={!data?.twitterStep2AuthUrl || step0}
            href={step2 ? data.twitterStep2AuthUrl?.replace('oauth/authenticate', 'oauth/authorize') : data?.twitterStep2AuthUrl}
        />
        <Button
            icon={<UserExpert color={step2 ? 'white' : null}/>}
            label={'Follow @UnfollowMonkey'}
            primary={step2}
            style={step2 ? {color: 'white'} : {}}
            href='https://twitter.com/unfollowmonkey'
            onClick={sendStep3Event}
            target='_blank'
            rel='noopener'
        />
      </Box>
  );
}
export default MiniApp;