import React, { Component } from "react";

import Firestack from "react-native-firestack";
const firestack = new Firestack();

const styles = require("./styles.js");

const MapViewComponent = require("./mapViewComponent");
const Database = require("./database.js");

import {
  View,
  Image,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  AlertIOS,
  Text,
  TouchableOpacity,
  Keyboard
} from "react-native";

class LoginComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      loading: true,
      waitingForFirebase: true
    };
  }

  componentWillMount() {
    // Check if the user is already logged in
    ref = this;

    firestack.auth.listenForAuth(function(evt) {
      if (!ref.state.waitingForFirebase) {
        if (evt.authenticated) {
          let nav = ref.props.navigator;
          let userId = evt.user.uid;
          ref.askForTwitterUser(userId, function() {
            nav.push({
              component: MapViewComponent,
              passProps: {
                title: "Map",
                userId: userId
              }
            });
          });
          ref.finishLoading();
          return;
        } else {
          return; // We don't care about this, the user manually logged in
        }
      }

      ref.setState({ waitingForFirebase: false });

      // evt is the authentication event
      // it contains an `error` key for carrying the
      // error message in case of an error
      // and a `user` key upon successful authentication
      if (!evt.authenticated) {
        ref.setState({ loading: false });
      } else {
        let user = evt.user;
        let userId = user.uid;
        ref.props.navigator.push({
          component: MapViewComponent,
          passProps: {
            title: "Map",
            userId: userId
          }
        });
        ref.finishLoading();
      }
    });

    firestack.analytics.logEventWithName("pageView", {
      screen: "LoginComponent"
    });
    firestack.analytics.logEventWithName("openLoginView");
  }

  async signup(email, pass) {
    this.setState({ loading: true });
    ref = this;
    firestack.auth
      .createUserWithEmail(email, pass)
      .then(userSession => {
        let userId = userSession.uid;
        console.log("Account created with ID: " + userId);
      })
      .catch(error => {
        this.setState({ loading: false });
        console.log(error);
        Alert.alert("Registration error", error.description);
      });
  }

  async login(email, pass) {
    this.setState({ loading: true });
    ref = this;
    firestack.auth
      .signInWithEmail(email, pass)
      .then(userSession => {
        let userId = userSession.uid;
        console.log("Logged In for user with ID: " + userId);
        // Loading the map is handled on the listener
      })
      .catch(error => {
        console.log(error);
        this.setState({ loading: false });
        Alert.alert("Login Error", error.rawDescription);
      });
  }

  // This method will add a delay, call it only on success
  finishLoading() {
    setTimeout(
      function() {
        ref.setState({ loading: false });
      },
      500
    ); // enable the buttons later for a smoother animation
  }

  askForTwitterUser(userId, successCallback) {
    Database.getUser(userId, function(value) {
      // First, check if there is an existing twitter username
      if (value != null && value.twitterUsername != null) {
        successCallback();
        return;
      }

      AlertIOS.prompt(
        "Twitter username or your name",
        "The name will be shown next to your marker. Please use your Twitter username if you have one, as it will be used to fetch your profile picture.\n\nIf you don't have a Twitter account, just enter your real name",
        [
          {
            text: "OK",
            onPress: function(twitterUsername) {
              twitterUsername = twitterUsername.replace("@", "");
              Database.setUserTwitterName(userId, twitterUsername);
              successCallback();
            }
          }
        ],
        "plain-text"
      );
    });
  }

  onPressRegister = () => {
    this.signup(this.state.email, this.state.password);
  };

  onPressLogin = () => {
    this.login(this.state.email, this.state.password);
  };

  dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  render() {
    return (
      <View style={styles.container} onPress={this.dismissKeyboard}>
        <Image
          source={require("./assets/headerImage.jpg")}
          style={styles.loginHeaderImage}
        >
          <Text style={styles.loginHeaderTitle}>
            wwdc.family
          </Text>
        </Image>
        <TouchableOpacity
          onPress={this.dismissKeyboard}
          style={styles.dismissKeyboardView}
        />
        <TextInput
          style={styles.email}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          style={styles.password}
          placeholder="Password"
          secureTextEntry={true}
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <View style={styles.buttonContainer}>
          <Button
            disabled={this.state.loading}
            onPress={this.onPressLogin}
            title="Login"
            style={styles.button}
            accessibilityLabel="Login"
          />
          <View style={{ marginLeft: 40 }} />
          <Button
            disabled={this.state.loading}
            onPress={this.onPressRegister}
            title="Register"
            style={styles.button}
            accessibilityLabel="Signup"
          />
        </View>
        <ActivityIndicator
          animating={this.state.loading}
          style={[styles.centering, { height: 80 }]}
          size="large"
        />
      </View>
    );
  }
}

module.exports = LoginComponent;
