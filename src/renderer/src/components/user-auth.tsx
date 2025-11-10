import { Github, Gitlab, GitlabIcon, LogOut, User2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useGitAuth from '@renderer/hooks/use-git-auth'
import {
  IGRPButtonPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPUserAvatarFallbackPrimitive,
  IGRPUserAvatarImagePrimitive,
  IGRPUserAvatarPrimitive
} from '@igrp/igrp-framework-react-design-system'

function GitConnectionMenu() {
  const { t } = useTranslation()
  const { loginGithub, loginGitLab, userGitHub, userGitLab, logoutGithub, logoutGitLab } =
    useGitAuth()

  return (
    <IGRPDropdownMenuPrimitive>
      <IGRPDropdownMenuTriggerPrimitive asChild>
        {userGitHub || userGitLab ? (
          <IGRPButtonPrimitive variant="ghost" size="icon" className="p-0">
            <IGRPUserAvatarPrimitive className="h-8 w-8">
              <>
                <IGRPUserAvatarImagePrimitive
                  src={userGitHub?.avatar_url || userGitLab?.avatar_url}
                  alt={userGitHub?.login || userGitLab?.username}
                />
                <IGRPUserAvatarFallbackPrimitive>
                  {userGitHub?.login.charAt(0).toUpperCase() ||
                    userGitLab?.username.charAt(0).toUpperCase()}
                </IGRPUserAvatarFallbackPrimitive>
              </>
            </IGRPUserAvatarPrimitive>
          </IGRPButtonPrimitive>
        ) : (
          <IGRPButtonPrimitive variant="ghost" size="icon" className="p-0">
            <User2Icon className="h-4 w-4" />
          </IGRPButtonPrimitive>
        )}
      </IGRPDropdownMenuTriggerPrimitive>
      <IGRPDropdownMenuContentPrimitive align="end">
        <IGRPDropdownMenuItemPrimitive>
          {userGitHub ? (
            <div className="flex items-center justify-between space-x-3 w-full">
              <div className="flex items-center space-x-2">
                <Github className="h-3 w-3" />
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userGitHub?.login}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userGitHub?.email}</p>
                </div>
              </div>
              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPButtonPrimitive variant="ghost" size="icon" onClick={logoutGithub}>
                    <LogOut className="h-3 w-3" />
                  </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                  <p>{t('logout')}</p>
                </IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </div>
          ) : (
            <div className="flex items-center cursor-pointer" onClick={loginGithub}>
              <Github className="mr-2 h-4 w-4" />
              <span>{t('connectGitHub')}</span>
            </div>
          )}
        </IGRPDropdownMenuItemPrimitive>
        <IGRPDropdownMenuItemPrimitive onClick={() => {}}>
          {userGitLab ? (
            <div className="flex items-center justify-between space-x-3 w-full">
              <div className="flex items-center space-x-2">
                <Gitlab className="h-3 w-3" />
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userGitLab.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userGitLab.email}</p>
                </div>
              </div>

              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPButtonPrimitive variant="ghost" size="icon" onClick={() => logoutGitLab()}>
                    <LogOut className="h-3 w-3" />
                  </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                  <p>{t('logout')}</p>
                </IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </div>
          ) : (
            <div className="flex items-center cursor-pointer" onClick={() => loginGitLab()}>
              <GitlabIcon className="mr-2 h-4 w-4" />
              <span>{t('connectGitLab')}</span>
            </div>
          )}
        </IGRPDropdownMenuItemPrimitive>
      </IGRPDropdownMenuContentPrimitive>
    </IGRPDropdownMenuPrimitive>
  )
}

export default GitConnectionMenu
