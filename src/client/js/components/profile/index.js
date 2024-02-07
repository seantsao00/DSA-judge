import Vue from 'vue';
import html from './index.pug';
import _ from 'lodash';
import {userLogin, getUser} from 'js/store';
import toastr from 'toastr';

$.fn.form.settings.rules.emptyOrMinLength = function(value, length) {
  return value === "" || value.length >= length;
};

$.fn.form.settings.rules.minLength = function(value, length) {
  return value.length >= length;
}

$.fn.form.settings.rules.maxLength = function(value, length) {
  return value.length <= length;
}

$.fn.form.settings.rules.alphanumeric = function(value) {
  return /^[A-Za-z0-9\u4e00-\u9fff]*$/.test(value);
}

const formValidateObj = {
    'new-name': {
        identifier: 'new-name',
        rules: [
            {
                type: 'alphanumeric',
                prompt: `New name contains invalid characters.`,
            },
            {
                type: 'maxLength[16]',
                prompt: `New name should not be longer than 16 characters.`,
            },
            {
                type: 'minLength[1]',
                prompt: `New name cannot be empty.`,
            },
        ],
    },
    'new-sshkey': {
        identifier: 'new-sshkey',
        rules: [
            {
                type: 'emptyOrMinLength[100]',
                prompt: `SSH key too short`,
            },
        ],
    },
    'new-password': {
        identifier: 'new-password',
        rules: [
            {
                type: 'emptyOrMinLength[8]',
                prompt: `Password too short`,
            },
        ],
    },
    "confirm-password": {
        identifier: 'confirm-password',
        rules: [
            {
                type: 'match[new-password]',
                prompt: `New password didn't matched`,
            },
        ],
    },
    "current-password": {
        identifier: 'current-password',
        rules: [
            {
                type: 'empty',
                prompt: `Password can't be empty`,
            },
        ],
    },
};

const formGitValidateObj = {
};


export default Vue.extend({
    data() {
        return {
        };
    },
    template: html,
    methods: {
        init() {
            this.initComponents();
        },
        getRole(user) {
            let role = '';
            if(user && user.roles.indexOf('admin') !== -1){
                role = role === '' ? 'Admin' : role + ' & Admin';
            }
            if(user && user.roles.indexOf('student') !== -1){
                role = role === '' ? 'Student' : role + ' & Student';
            }
            if(user && user.roles.indexOf('TA') !== -1){
                role = role === '' ? 'TA' : role + ' & TA';
            }
            if(user && user.roles.indexOf('auditor') !== -1){
                role = role === '' ? 'Auditor' : role + ' & Auditor';
            }
            if(role === ''){
                role = 'Auditor';
            }
            return role;
        },
        initComponents() {
            const me = this;

            const $form = $('#profile-form');
            $form.form({
                fields: formValidateObj,
                onSuccess(e, fields) {
                    e.preventDefault();
                    (async () => {
                        let res;
                        try {
                            res = await me.$http.post('/user/changePassword', fields);
                            console.log(res);
                        } catch(err) {
                            if ('body' in err) toastr.error(err.body);
                            else toastr.error(err);
                        }
                        toastr.success(res.body);
                        const result = (await me.$http.get('/user/me')).data;
                        if (result.login) {
                            me.userLogin(result.user);
                        }
                        ['current', 'new', 'confirm'].forEach(x => {
                            $form.form('set value', `${x}-password`, '');
                        });
                    })();
                }
            });
        },
        clickLogin() {
            this.$loginModal.modal('show');
        },
    },
    ready() {
        this.init();
    },
    vuex: {
        actions: {
            userLogin,
        },
        getters: {
            user: getUser,
        },
    },
});
