import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';

import { GET_ERRORS, SET_CURRENT_USER } from './types';
//Register User
export const registerUser = (userData, history) => dispatch => {
  axios
    .post('/api/users/register', userData)
    .then(res => history.push('/login') )
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    )
};

// Get token and Login
export const loginUser = userData => dispatch => {
  axios.post('/api/users/login', userData)
    .then(res => {
      //Save to localStorage
      const { token } = res.data;
      // Set token to localStorage
      // localStorage only stores Strings
      localStorage.setItem('jwtToken', token);
      // Set Token to Auth Header
      setAuthToken(token);
      // Decode Token
      const decoded = jwt_decode(token);
      // Set User
      dispatch(setCurrentUser(decoded));
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    )
};

// Set Logged User
export const setCurrentUser = (decoded) => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  }
}

// Log User Out
export const logoutUser = () => dispatch => {
  // Remove Token
  localStorage.removeItem('jwtToken');
  // Remove auth header for future request
  setAuthToken(false)
  // Set Current User to {} which will set isAuth to false
  dispatch(setCurrentUser({}));
}
