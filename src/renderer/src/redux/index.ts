import { combineReducers, Reducer } from 'redux'
import gitSlice, { GitState } from './git/reducer'
import PageBuilderReducer, { StudioState } from './pageBuilder/reducer'

export type RootState = {
  PageBuilder: StudioState
  git: GitState
}

const rootReducer: Reducer<RootState> = combineReducers({
  PageBuilder: PageBuilderReducer,
  git: gitSlice
})
export default rootReducer
