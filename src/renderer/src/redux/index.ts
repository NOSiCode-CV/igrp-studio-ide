import { combineReducers, type Reducer } from '@reduxjs/toolkit'
import gitSlice, { type GitState } from './git/reducer'
import PageBuilderReducer, { type StudioState } from './pageBuilder/reducer'
import specDataReducer, { type SpecDataState } from './specData/reducer'
import specDocsReducer, { type SpecDocsState } from './specDocs/reducer'
import specKBReducer, { type SpecKBState } from './specKB/reducer'
import specPrototypeReducer, { type SpecPrototypeState } from './specPrototype/reducer'

export type RootState = {
    PageBuilder: StudioState
    git: GitState
    specKB: SpecKBState
    specDocs: SpecDocsState
    specPrototype: SpecPrototypeState
    specData: SpecDataState
}

const rootReducer: Reducer<RootState> = combineReducers({
    PageBuilder: PageBuilderReducer,
    git: gitSlice,
    specKB: specKBReducer,
    specDocs: specDocsReducer,
    specPrototype: specPrototypeReducer,
    specData: specDataReducer
})
export default rootReducer
