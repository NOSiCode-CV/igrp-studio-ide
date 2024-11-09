import { combineReducers } from 'redux'

import PageBuilderReducer from "./pageBuilder/reducer";

const rootReducer = combineReducers({
  PageBuilder: PageBuilderReducer
})
export default rootReducer
