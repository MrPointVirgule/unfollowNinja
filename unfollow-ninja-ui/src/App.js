import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { nanoid } from 'nanoid';
import Cookies from 'js-cookie'

import './style.scss';
import 'react-github-cards/dist/default.css';

import {Box, Grommet, Heading, Image, Paragraph, Text} from 'grommet';
import { RepoCard } from 'react-github-cards';
import GithubCorner from "react-github-corner";

import { Faq, Link, MiniApp, Navbar, Section }  from "./components";
import * as Images from './images';

const theme = {
  global: {
    font: {
      family: 'Open Sans',
    },
    colors: {
      doc: '#4c4e6e',
      dark: '#1a1b46',
      lightPink: '#ffeeed',
      brand: '#70B7FD',
    },
  },
  heading: {
    font: {
      family: 'Quicksand',
    },
    weight: 700,
  },
  paragraph: {
    large: {
      height: '32px',
    },
    medium: {
      maxWidth: '800px',
    },
  },
};

if (!Cookies.get('uid')) {
  if (sessionStorage['uid']) { // for the transition sessionStorage->cookie TODO remove
    Cookies.set('uid', sessionStorage['uid'], { secure: window.location.protocol === 'https:' });
  } else {
    Cookies.set('uid', nanoid(), { secure: true });
  }
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'https://api.unfollow-monkey.com',
  headers: {
    uid: Cookies.get('uid'),
  }
});

function App() {
  const isFrench = navigator.language?.startsWith && navigator.language.startsWith('fr') && navigator.userAgent !== 'ReactSnap';
  return (
      <Grommet theme={theme}>
        <Section>
          <Navbar/>
        </Section>
        <Section>
          <Box direction='row' wrap={true} margin={{vertical: 'large'}}>
            <Box basis='medium' flex={true} pad='medium'>
              <Heading level={1} color='dark'>Get notified when your Twitter account loses a follower</Heading>
              <Paragraph size='large'>Unfollow Monkey sends you a direct message as soon as a twitter user unfollows you, blocks you, or leave Twitter, within seconds.</Paragraph>
              {isFrench ? <Paragraph margin={{top: 'xsmall'}}>
                Francais? Découvrez aussi <Link href='https://unfollow.ninja/?utm_source=unfollowmonkey'>https://unfollow.ninja</Link>
              </Paragraph> : null}
              <ApolloProvider client={client}>
                <Router>
                  <MiniApp/>
                </Router>
              </ApolloProvider>
            </Box>
            <Box basis='medium' flex={true} pad='medium'>
              <Image width='100%' title='Example of notification' src={Images.DmScreenshot}/>
            </Box>
          </Box>
        </Section>
        <Section background='lightPink' sloped={true}>
          <Box direction='row' wrap={true} align='center' justify='center'>
            <Box direction='row' basis='300px' flex='shrink' pad='medium' style={{maxWidth: '50vw'}}>
              <Image title='dog playing' fit='contain' src={Images.Dog}/>
            </Box>
            <Box basis='medium' flex={true} pad='medium' >
              <Heading level={2} color='dark'>Unfollow Monkey is free for everyone</Heading>
              <Paragraph>Unfollow Monkey is based on the <Link href='https://github.com/PLhery/unfollowNinja'>open-source</Link> project <Link href='https://unfollow.ninja'>unfollowNinja</Link>, hosted by <Link href='https://pulseheberg.com/'>PulseHeberg</Link> and maintained by <Link href='https://twitter.com/plhery'>@plhery</Link>.</Paragraph>
              <Paragraph>Thanks to PulseHeberg for helping the project to remain substainable, efficient, free, supporting 100 000+ users. They also provide <Link href='https://pulseheberg.com/'>great and affordable servers and web hosting solutions</Link>, if you'd like to have a look!</Paragraph>
              <Box gap='small' alignSelf='center' style={{overflow: 'hidden'}}>
                <RepoCard username="plhery" repo="unfollowninja"/>
              </Box>
            </Box>
          </Box>
        </Section>
        <Section background={`url(${Images.useAlaska()})`}>
          <Faq/>
        </Section>
        <Section>
          <Box direction='row' align='center' alignSelf='center' gap='small'>
            <Image title='logo' height={30} src={Images.Logo}/>
            <Text size='small' textAlign='center' style={{fontFamily: 'quicksand'}}>
              © 2020 UnfollowMonkey · <Link href='https://www.privacypolicies.com/live/9050f832-39c9-4bec-8eb4-3ddf5ee5cbaa'>TOS</Link> ·
              Discover also <Link href='https://unfollow.ninja/?utm_source=unfollowmonkey_footer'><Image title='unfollowNinja' height={21} src={Images.UnfollowNinja}/></Link> UnfollowNinja <Link href='https://uzzy.me/en?utm_source=unfollowmonkey'><Image title='uzzy' src={Images.Uzzy} height={18}/></Link> Uzzy and <Link href='https://affinitweet.com/?utm_source=unfollowmonkey'><Image title='affinitweet' src={Images.Affinitweet} height={18}/></Link> Affinitweet ·
              Made with ♥ by <Link href='https://twitter.com/plhery'>@plhery</Link> · Available on <Link href='https://twitter.com/plhery'>GitHub</Link>
            </Text>
          </Box>
        </Section>
        <GithubCorner href="https://github.com/PLhery/unfollowNinja" bannerColor="#70B7FD"/>
      </Grommet>
  );
}

export default App;
