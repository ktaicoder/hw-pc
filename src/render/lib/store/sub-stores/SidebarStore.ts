import { action, observable, makeObservable } from 'mobx'
import log from 'src/render/log'
import { nav } from 'src/render/lib/nav'

/**
 * 사이드바 상태를 보관하는 mobx 스토어
 */
export class SidebarStore {
  constructor() {
    makeObservable(this)
  }

  /**
   * 열림 상태
   */
  @observable isOpen = true

  /**
   * 자동 열림 완료 여부
   */
  @observable isAutoOpenFinish = false

  /**
   * 펼쳐진 sectionId 목록
   */
  @observable expandedSectionIds: nav.MenuIdType[] = []

  /**
   * 사이드바 열림 상태 변경
   * @param isOpen 열림 상태
   */
  @action setOpen = (isOpen: boolean) => {
    this.isOpen = isOpen
  }

  /**
   * 열림 상태 토글
   */
  @action toggleOpen = (isOpen?: boolean) => {
    if (typeof isOpen == 'undefined') {
      log.debug(`toggleOpen() changed to ${!this.isOpen}`)
      this.isOpen = !this.isOpen
    } else {
      this.isOpen = isOpen
    }
  }

  /**
   * 자동 열림 완료 여부 설정
   * @param isFinish 완료 여부
   */
  @action setAutoOpenFinish = (isFinish: boolean) => {
    this.isAutoOpenFinish = isFinish
  }

  /**
   * 왼쪽 메뉴 섹션 펼침
   * @param sectionId 펼칠 섹션 ID
   */
  @action expandSection = (sectionId: nav.MenuIdType) => {
    const idx = this.expandedSectionIds.indexOf(sectionId)
    if (idx < 0) {
      this.expandedSectionIds.push(sectionId)
    }
  }

  /**
   * 왼쪽 메뉴 섹션 접기
   * @param sectionId 펼칠 섹션 ID
   */
  @action foldSection = (sectionId: nav.MenuIdType) => {
    const idx = this.expandedSectionIds.indexOf(sectionId)
    if (idx >= 0) {
      this.expandedSectionIds.splice(idx, 1)
    }
  }

  /**
   * 왼쪽 메뉴 섹션 펼침 상태 토글
   * @param sectionId 토글 할 섹션 ID
   */
  @action toggleExpandSection = (sectionId: nav.MenuIdType) => {
    const idx = this.expandedSectionIds.indexOf(sectionId)
    if (idx >= 0) {
      this.expandedSectionIds.splice(idx, 1)
    } else {
      this.expandedSectionIds.push(sectionId)
    }
    log.debug('this.expandedSectionIds=', this.expandedSectionIds)
  }
}
