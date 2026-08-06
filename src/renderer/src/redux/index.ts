import { combineReducers, type Reducer } from '@reduxjs/toolkit'
import gitSlice, { type GitState } from './git/reducer'
import notificationsReducer, { type NotificationsState } from './notifications/reducer'
import PageBuilderReducer, { type StudioState } from './pageBuilder/reducer'
import specDataReducer, { type SpecDataState } from './specData/reducer'
import specDocsReducer, { type SpecDocsState } from './specDocs/reducer'
import specKBReducer, { type SpecKBState } from './specKB/reducer'
import specPrototypeReducer, { type SpecPrototypeState } from './specPrototype/reducer'
import specPrototypeManifestReducer, {
    type SpecPrototypeManifestState
} from './specPrototypeManifest/reducer'

export type RootState = {
    PageBuilder: StudioState
    git: GitState
    notifications: NotificationsState
    specKB: SpecKBState
    specDocs: SpecDocsState
    specPrototype: SpecPrototypeState
    specPrototypeManifest: SpecPrototypeManifestState
    specData: SpecDataState
}

const rootReducer: Reducer<RootState> = combineReducers({
    PageBuilder: PageBuilderReducer,
    git: gitSlice,
    notifications: notificationsReducer,
    specKB: specKBReducer,
    specDocs: specDocsReducer,
    specPrototype: specPrototypeReducer,
    specPrototypeManifest: specPrototypeManifestReducer,
    specData: specDataReducer
})
export default rootReducer
