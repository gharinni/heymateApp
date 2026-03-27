import { registerRootComponent } from 'expo';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';

function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

registerRootComponent(Root);