<script>
import {
  get,
  setTimeoutCallback,
  resetTimeout,
  getWarningMessage,
  getLogoutMessage,
  failedTouch,
} from './utility'
import axios from 'axios'
import { sanitizeUrl } from '@braintree/sanitize-url'

export default {
  components: {},
  props: {
    warningMessage: {
      type: String,
    },
    logoutMessage: {
      type: String,
    },
  },
  data: function () {
    return {
      dialogVisible: false,
      title: '',
      message: '',
      showFlag: 'warning',
      callingTimeout: undefined,
    }
  },
  mounted() {
    setTimeoutCallback({
      warning: this.setWarningInfo,
      logout: this.setErrorLogoutInfo,
      clear: this.clearWindowCallback,
      touch: this.makeTouchCall,
    })
  },
  methods: {
    warningLogin() {
      this.makeTouchCall()
    },
    lockLogin() {
      window.location.href = sanitizeUrl(get().login_url)
    },
    makeTouchCall() {
      axios.get(get().touch_url).then(function (...args) {
        if (get().touch_validation(...args)) {
          resetTimeout()
        } else {
          failedTouch()
        }
      })
    },
    setErrorLogoutInfo() {
      const vm = this
      vm.$EventBus.$emit('session-timeout-logout', true)
      vm.dialogVisible = true
      vm.showFlag = 'lock'
      vm.title = 'Inactivity Logout!'
      vm.message = vm.logoutMessage ? vm.logoutMessage : getLogoutMessage()

      // document.querySelector('.modal-backdrop').className +=
      //   ' ' + "loggedOut"
      // document.querySelector('.sideBar').style.display = 'none'
      document.querySelector('.modal-backdrop').style.backgroundColor = 'grey'
      document.querySelector('.topBar').style.display = 'none'
      /*        setTimeout(() => {
          this.lockLogin();
        }, 10 * 1000)
        */
    },
    setWarningInfo() {
      const vm = this
      vm.dialogVisible = true
      vm.showFlag = 'warning'
      vm.title = 'Inactivity Warning!'
      vm.message = vm.warningMessage ? vm.warningMessage : getWarningMessage()
    },
    clearWindowCallback() {
      const vm = this
      vm.dialogVisible = false
    },
    userAction() {
      if (this.showFlag === 'warning') this.warningLogin()
      else if (this.showFlag === 'lock') this.lockLogin()
    },
  },
}
</script>

<template>
  <BModal
    id="inactivity-logout-warning"
    v-model="dialogVisible"
    centered
    no-close-on-backdrop
    no-close-on-esc
    :title="title"
    :ok-title="showFlag === 'warning' ? 'Yes, remain logged in' : 'OK'"
    ok-variant="primary"
    ok-only
    content-class="modalDefault"
    title-class="modalTitleDefault"
    header-class="modalHeaderWarning"
    body-class="modalBodyDefault"
    footer-class="modalFooterDefault"
    @ok="userAction"
  >
    <span>{{ message }}</span>
  </BModal>
</template>

<style module>
.message {
  font-size: 18px;
}

/*
        modal fix for session time out, to white out the whole page
    */
.loggedOut {
  background-color: grey !important;
  opacity: 1 !important;
}
</style>
