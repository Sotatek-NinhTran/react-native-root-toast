import React, {
  Component
} from 'react';
import PropTypes from 'prop-types';
import {
  ViewPropTypes,
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Easing,
  Keyboard, Platform
} from 'react-native';
import SuccessIcon from "./success.svg";
import ErrorIcon from "./error.svg";
import WarningIcon from "./warning.svg";
import {moderateScale, scale} from "./scalingUtils";
const TOAST_MAX_WIDTH = 0.8;
const TOAST_ANIMATION_DURATION = 200;

function isIphoneX() {
  const dimen = Dimensions.get('window');
  return (
      Platform.OS === 'ios'
      && !Platform.isPad
      && !Platform.isTVOS
      && (dimen.height === 812 || dimen.width === 812 || dimen.height === 896 || dimen.width === 896)
  );
}

const positions = {
  TOP: 20,
  BOTTOM: isIphoneX() ? 110 : 70,
  CENTER: 0
};

const durations = {
  LONG: 3500,
  SHORT: 2000
};

let styles = StyleSheet.create({
  defaultStyle: {
      position: 'absolute',
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center'
  },
  containerStyle: {
      backgroundColor: 'transparent',
  },
  shadowStyle: {
      shadowColor: '#000',
      shadowOffset: {
          width: 4,
          height: 4
      },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 10
  },
  message: {
      marginLeft: scale(12),
      fontSize: moderateScale(14),
      lineHeight: scale(21),
      fontFamily: 'Poppins-Regular',
      color: '#fff',
      flex:1,
  },
  container: {
      width: scale(336),
      height: scale(40),
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: scale(3),
      paddingHorizontal:scale(18)
  },
});

class ToastContainer extends Component {
  static displayName = 'ToastContainer';

  static propTypes = {
      ...ViewPropTypes,
      containerStyle: ViewPropTypes.style,
      duration: PropTypes.number,
      visible: PropTypes.bool,
      position: PropTypes.number,
      animation: PropTypes.bool,
      shadow: PropTypes.bool,
      backgroundColor: PropTypes.string,
      opacity: PropTypes.number,
      shadowColor: PropTypes.string,
      delay: PropTypes.number,
      hideOnPress: PropTypes.bool,
      onPress: PropTypes.func,
      onHide: PropTypes.func,
      onHidden: PropTypes.func,
      onShow: PropTypes.func,
      onShown: PropTypes.func,
      success: PropTypes.bool,
      failed: PropTypes.bool,
      warning: PropTypes.bool,
      type: PropTypes.string
  };

  static defaultProps = {
      visible: false,
      duration: durations.SHORT,
      animation: true,
      shadow: true,
      position: positions.TOP,
      opacity: 0.8,
      delay: 0,
      hideOnPress: true,
      success: false,
      failed: false,
      warning: false,
  };

  constructor() {
      super(...arguments);
      const window = Dimensions.get('window');
      this.state = {
          visible: this.props.visible,
          opacity: new Animated.Value(0),
          windowWidth: window.width,
          windowHeight: window.height,
          keyboardScreenY: window.height,
          success: this.props.success
      };
  }

  componentWillMount() {
      Dimensions.addEventListener('change', this._windowChanged);
      Keyboard.addListener('keyboardDidChangeFrame', this._keyboardDidChangeFrame);
  }

  componentDidMount = () => {
      if (this.state.visible) {
          this._showTimeout = setTimeout(() => this._show(), this.props.delay);
      }
  };

  componentWillReceiveProps = nextProps => {
      if (nextProps.visible !== this.props.visible) {
          if (nextProps.visible) {
              clearTimeout(this._showTimeout);
              clearTimeout(this._hideTimeout);
              this._showTimeout = setTimeout(() => this._show(), this.props.delay);
          } else {
              this._hide();
          }

          this.setState({
              visible: nextProps.visible
          });
      }
  };

  componentWillUpdate() {
      const { windowHeight, keyboardScreenY } = this.state;
      this._keyboardHeight = Math.max(windowHeight - keyboardScreenY, 0);
  }

  componentWillUnmount = () => {
      Dimensions.removeEventListener('change', this._windowChanged);
      Keyboard.removeListener('keyboardDidChangeFrame', this._keyboardDidChangeFrame);
      this._hide();
  };

  _animating = false;
  _root = null;
  _hideTimeout = null;
  _showTimeout = null;
  _keyboardHeight = 0;

  _windowChanged = ({ window }) => {
      this.setState({
          windowWidth: window.width,
          windowHeight: window.height
      })
  };

  _keyboardDidChangeFrame = ({ endCoordinates }) => {
      this.setState({
          keyboardScreenY: endCoordinates.screenY
      })
  };

  _show = () => {
      clearTimeout(this._showTimeout);
      if (!this._animating) {
          clearTimeout(this._hideTimeout);
          this._animating = true;
          this._root.setNativeProps({
              pointerEvents: 'auto'
          });
          this.props.onShow && this.props.onShow(this.props.siblingManager);
          Animated.timing(this.state.opacity, {
              useNativeDriver: true,
              toValue: this.props.opacity,
              duration: this.props.animation ? TOAST_ANIMATION_DURATION : 0,
              easing: Easing.out(Easing.ease)
          }).start(({finished}) => {
              if (finished) {
                  this._animating = !finished;
                  this.props.onShown && this.props.onShown(this.props.siblingManager);
                  if (this.props.duration > 0) {
                      this._hideTimeout = setTimeout(() => this._hide(), this.props.duration);
                  }
              }
          });
      }
  };

  _hide = () => {
      clearTimeout(this._showTimeout);
      clearTimeout(this._hideTimeout);
      if (!this._animating) {
          this._root.setNativeProps({
              pointerEvents: 'none'
          });
          this.props.onHide && this.props.onHide(this.props.siblingManager);
          Animated.timing(this.state.opacity, {
              useNativeDriver: true,
              toValue: 0,
              duration: this.props.animation ? TOAST_ANIMATION_DURATION : 0,
              easing: Easing.in(Easing.ease)
          }).start(({finished}) => {
              if (finished) {
                  this._animating = false;
                  this.props.onHidden && this.props.onHidden(this.props.siblingManager);
              }
          });
      }
  };

  render() {
      let {props} =  this;
      const { windowWidth } = this.state;
      let offset = props.position;
      let position = {'bottom': offset}
      const InnerView = this.props.view;
      return (this.state.visible || this._animating) ? 
          <View
              style={[styles.defaultStyle, position]}
              pointerEvents="box-none"
          >
              <TouchableWithoutFeedback
                  onPress={() => {
                      typeof this.props.onPress === 'function' ? this.props.onPress() : null
                      this.props.hideOnPress ? this._hide() : null
                  }}
              >
                  <Animated.View
                      style={[styles.containerStyle,
                          { marginHorizontal: windowWidth * ((1 - TOAST_MAX_WIDTH) / 2) },
                          props.containerStyle,
                         
                          {
                              opacity: this.state.opacity
                          },
                          props.shadow && styles.shadowStyle,
                          props.shadowColor && {shadowColor: props.shadowColor}]}
                      pointerEvents="none"
                      ref={ele => this._root = ele}
                  >
                      {props.success && this._renderSuccessView()}
                      {props.failed && this._renderFailedView()}
                      {props.warning && this._renderWaringView()}
                  </Animated.View>
              </TouchableWithoutFeedback>
          </View> 
      : null
  }

  _renderSuccessView = () => {
    return(
      <View style={[
        styles.container, 
        {backgroundColor: '#3ADA81'}, 
        this.props.type === 'light' && {backgroundColor: 'rgba(58, 218, 129, 0.1)'}
      ]}>
        {this.props.icon ? 
          this.props.icon 
        : <SuccessIcon color={this.props.type === 'light' ? '#3ADA81' : '#FFFFFF'} width={scale(20)} height={scale(20)}/>}
        <Text
          allowFontScaling={false}
          numberOfLines={4}
          style={[styles.message, {color: this.props.type === 'light' ? '#3ADA81' : '#FFFFFF'}]}
        >
          {this.props.children}
        </Text>
      </View>
    )
  }

  _renderFailedView = () => {
    return (
      <View style={[styles.container, {backgroundColor: '#FB7181'}, this.props.type === 'light' && {backgroundColor: 'rgba(251, 113, 129, 0.1)'}]}>
        {this.props.icon ? this.props.icon  : <ErrorIcon color={this.props.type === 'light' ? '#FB7181' : '#FFFFFF'} width={scale(20)} height={scale(20)}/>}
        <Text
            allowFontScaling={false}
            numberOfLines={4}
            style={[styles.message, {color: this.props.type === 'light' ? '#FB7181' : '#FFFFFF'}]}>{this.props.children}
        </Text>
      </View>
    );
  }

  _renderWaringView = () => {
    return (
      <View style={[styles.container, {backgroundColor: '#FFC833'},  this.props.type === 'light' && {backgroundColor: 'rgba(255, 200, 51, 0.1)'}]}>
        {this.props.icon ? this.props.icon  : <WarningIcon color={this.props.type === 'light' ? '#FFC833' : '#FFFFFF'} width={scale(20)} height={scale(20)}/>}
        <Text
            allowFontScaling={false}
            numberOfLines={4}
            style={[styles.message, {color: this.props.type === 'light' ? '#FFC833' : '#FFFFFF'}]}>{this.props.children}
        </Text>
      </View>
    );
  }
}

export default ToastContainer;
export {
  positions,
  durations
}
