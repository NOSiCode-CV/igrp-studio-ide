import { combineReducers, type Reducer } from 'redux'
import gitSlice, { type GitState } from './git/reducer'
import PageBuilderReducer, { type StudioState } from './pageBuilder/reducer'

export type RootState = {
    PageBuilder: StudioState
    git: GitState
}

const rootReducer: Reducer<RootState> = combineReducers({
    PageBuilder: PageBuilderReducer,
    git: gitSlice
})
export default rootReducer
