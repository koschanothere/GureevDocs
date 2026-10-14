# Custom NSIS hooks for the GureevDoc installer (picked up automatically by
# electron-builder from build/installer.nsh).
#
# If a GureevDoc database already exists for the current Windows user, the wizard
# shows one extra page right before the files are installed, with a checkbox
# (checked by default) to copy the database into
#   %APPDATA%\GureevDoc\backups\
# first. The app migrates its database on first start after an update, so this
# copy is the way back if anything goes wrong.
#
# The data location must match app.setName("GureevDoc") in src/main/main.js and
# the "data/gureevdoc.sqlite" path in src/main/store.js.
#
# Silent installs (/S) have no wizard, so they always take the backup.
# This file must be saved as UTF-8 *with BOM* so NSIS reads the Cyrillic text.

!ifndef BUILD_UNINSTALLER

!macro customPageAfterChangeDir
  Page custom DbBackupPageShow DbBackupPageLeave
!macroend

!macro customInit
  ${If} ${Silent}
    Call DbBackupFindDatabase
    ${If} $DbBackupSrc != ""
      Call DbBackupCreate
    ${EndIf}
  ${EndIf}
!macroend

!macro customHeader
  !include LogicLib.nsh
  !include nsDialogs.nsh
  !include FileFunc.nsh
  !insertmacro GetTime

  Var DbBackupPage
  Var DbBackupCheckbox
  Var DbBackupWanted
  Var DbBackupSrc
  Var DbBackupDir

  # Sets $DbBackupDir, and $DbBackupSrc (empty when there is no database).
  Function DbBackupFindDatabase
    ReadEnvStr $0 APPDATA
    StrCpy $DbBackupDir "$0\GureevDoc\backups"
    StrCpy $DbBackupSrc "$0\GureevDoc\data\gureevdoc.sqlite"
    IfFileExists "$DbBackupSrc" found
    StrCpy $DbBackupSrc ""
    found:
  FunctionEnd

  # Pops a file path, pushes its size in bytes (0 if it cannot be read).
  Function DbBackupFileSize
    Exch $1
    Push $2
    StrCpy $2 0
    ClearErrors
    FileOpen $0 "$1" r
    IfErrors done
    FileSeek $0 0 END $2
    FileClose $0
    done:
    StrCpy $1 $2
    Pop $2
    Exch $1
  FunctionEnd

  # Copies the database into the backups folder. Result in $0: "ok" or "error".
  Function DbBackupCreate
    ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
    StrCpy $7 "$2-$1-$0_$4-$5-$6"
    StrCpy $8 "$DbBackupDir\gureevdoc_before-v${VERSION}_$7.sqlite"

    ClearErrors
    CreateDirectory "$DbBackupDir"
    CopyFiles /SILENT "$DbBackupSrc" "$8"

    # CopyFiles does not reliably report failures, so compare sizes.
    Push "$DbBackupSrc"
    Call DbBackupFileSize
    Pop $9
    Push "$8"
    Call DbBackupFileSize
    Pop $0
    ${If} $0 == $9
      StrCpy $0 "ok"
    ${Else}
      StrCpy $0 "error"
    ${EndIf}
  FunctionEnd

  Function DbBackupPageShow
    Call DbBackupFindDatabase
    ${If} $DbBackupSrc == ""
      Abort
    ${EndIf}

    !insertmacro MUI_HEADER_TEXT "Резервная копия данных" "Найдена база данных GureevDoc"
    nsDialogs::Create 1018
    Pop $DbBackupPage
    ${If} $DbBackupPage == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0u 0u 296u 34u "На этом компьютере уже есть данные GureevDoc. Установка их не удаляет, но новая версия при первом запуске обновит структуру базы."
    Pop $0
    ${NSD_CreateCheckbox} 0u 40u 296u 12u "Создать резервную копию базы данных перед установкой (рекомендуется)"
    Pop $DbBackupCheckbox
    ${If} $DbBackupWanted != "0"
      ${NSD_Check} $DbBackupCheckbox
    ${EndIf}
    ${NSD_CreateLabel} 0u 60u 296u 36u "Копия будет сохранена в папке:$\r$\n$DbBackupDir"
    Pop $0
    nsDialogs::Show
  FunctionEnd

  Function DbBackupPageLeave
    ${NSD_GetState} $DbBackupCheckbox $0
    ${If} $0 == ${BST_CHECKED}
      StrCpy $DbBackupWanted "1"
      Call DbBackupCreate
      ${If} $0 != "ok"
        MessageBox MB_YESNO|MB_ICONEXCLAMATION "Не удалось создать резервную копию базы данных.$\r$\n$\r$\nПродолжить установку без неё?" IDYES continue
        Abort
        continue:
      ${EndIf}
    ${Else}
      StrCpy $DbBackupWanted "0"
    ${EndIf}
  FunctionEnd
!macroend

!endif
