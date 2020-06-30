import { loginByUsername } from '@/api/login';
import { getToken, setToken, removeToken } from '@/utils/auth';
import {
  getCurUser,
  updateCurUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} from '../../api/user';

const user = {
  state: {
    curUser: {},
    token: getToken(),
    roles: [],
    setting: {
      articlePlatform: []
    },
    users: [],
    employees: [],
    leaders: [],
    permissions: false
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_INTRODUCTION: (state, introduction) => {
      state.introduction = introduction;
    },
    SET_SETTING: (state, setting) => {
      state.setting = setting;
    },
    SET_USER: (state, user) => {
      state.curUser = user;
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
    },
    SET_USERS: (state, users) => {
      state.users = users;
    },
    SET_LEADERS: (state, leaders) => {
      state.leaders = leaders;
    },
    SET_EMPLOYEES: (state, employees) => {
      state.employees = employees;
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions;
    }
  },

  actions: {
    // 用户名登录
    LoginByUsername({ commit }, userInfo) {
      const username = userInfo.username.trim();
      return new Promise((resolve, reject) => {
        loginByUsername(username, userInfo.password)
          .then(response => {
            const data = response;
            commit('SET_TOKEN', data.accessToken);
            setToken(data.accessToken);
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    },

    GetUserInfo({ commit, state }) {
      return new Promise(resolve => {
        getCurUser().then(user => {
          commit('SET_USER', user);
          commit(
            'SET_PERMISSIONS',
            ['Director', 'SuperAdmin'].includes(user.role)
          );
          commit('SET_ROLES', [user.role]);
          resolve(user);
        });
      });
    },
    UpdateCurUser({ commit, dispatch }, updatedUser) {
      return new Promise((resolve, reject) => {
        console.log('updatedUser.file', updatedUser.file);

        if (updatedUser.file) {
          dispatch('UploadImage', updatedUser.file).then(imageId => {
            updatedUser.data.avatarImageId = imageId;
            console.log('updatedUser.data :>> ', updatedUser.data);
            updateCurUser(updatedUser.data).then(user => {
              commit('SET_USER', user);
              commit('SET_ROLES', [user.role]);
              resolve(user);
            });
          });
        } else if (updatedUser.file === null) {
          updateCurUser(updatedUser.data).then(user => {
            commit('SET_USER', user);
            commit('SET_ROLES', [user.role]);
            resolve(user);
          });
        }
      });
    },

    // 第三方验证登录
    // LoginByThirdparty({ commit, state }, code) {
    //   return new Promise((resolve, reject) => {
    //     commit('SET_CODE', code)
    //     loginByThirdparty(state.status, state.email, state.code).then(response => {
    //       commit('SET_TOKEN', response.data.token)
    //       setToken(response.data.token)
    //       resolve()
    //     }).catch(error => {
    //       reject(error)
    //     })
    //   })
    // },

    // 登出
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        commit('SET_TOKEN', '');
        commit('SET_ROLES', []);
        commit('SET_USERS', []);
        commit('SET_USER', {});
        commit('SET_PERMISSIONS', false);
        removeToken();
        resolve();
      });
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '');
        removeToken();
        resolve();
      });
    },

    // 动态修改权限
    ChangeRoles({ commit, dispatch }, role) {
      return new Promise(resolve => {
        commit('SET_TOKEN', role);
        setToken(role);
        getCurUser().then(response => {
          const data = response.data;
          commit('SET_ROLES', data.roles);
          // commit('SET_NAME', data.name);
          // commit('SET_AVATAR', data.avatar);
          // commit('SET_INTRODUCTION', data.introduction);
          dispatch('GenerateRoutes', data); // 动态修改权限后 重绘侧边菜单
          resolve();
        });
      });
    },
    GetAllUser({ commit, dispatch }, query) {
      return new Promise(resolve => {
        getAllUsers(query).then(res => {
          commit('SET_USERS', res);
          resolve(res);
        });
      });
    },
    GetEmployeeFree({ commit, dispatch }) {
      return new Promise(resolve => {
        const query = {
          name: null,
          role: 'Employee',
          available: 'true',
          contractable: null // thực tế là true vì nhân viên đã kí hợp đồng
        };
        getAllUsers(query).then(res => {
          commit('SET_EMPLOYEES', res);
          resolve(res);
        });
      });
    },
    GetLeaderFree({ commit, dispatch }) {
      return new Promise(resolve => {
        const query = {
          name: null,
          role: 'Manager',
          available: 'true',
          contractable: null // thực tế là true vì nhân viên đã kí hợp đồng
        };
        getAllUsers(query).then(res => {
          commit('SET_LEADERS', res);
          resolve(res);
        });
      });
    },
    CreateUser({ commit, dispatch }, user) {
      return new Promise((resolve, reject) => {
        createUser(user).then(res => {
          dispatch('GetAllUser');
          resolve(res);
        });
      });
    },
    UpdateUser({ commit, dispatch }, data) {
      return new Promise((resolve, reject) => {
        updateUser(data.userId, data.newData).then(res => {
          dispatch('GetAllUser');
          resolve(res);
        });
      });
    },
    DeleteUser({ commit, state }, userId) {
      return new Promise(resolve => {
        deleteUser(userId).then(res => {
          const users = state.users.filter(item => item.userId !== userId);
          commit('SET_USERS', users);
          resolve(res);
        });
      });
    },
    ChangePassword({ commit, dispatch }, data) {
      return new Promise(resolve => {
        changePassword(data)
          .then(res => {
            dispatch('GetUserInfo');
            resolve(res);
          })
          .catch(e => resolve(e));
      });
    },
    GetUserNotInTeam({ commit, dispatch }, data) {
      return new Promise(resolve => {
        const { users, teamId } = data;
        var userIdInTeam = [];
        dispatch('GetTeamByID', teamId).then(res => {
          userIdInTeam = res.membersId;
          var userNotInTeam = [];
          users.forEach(item => {
            if (userIdInTeam.includes(item.userId.trim()) === false) {
              userNotInTeam.push(item);
            }
          });
          resolve(userNotInTeam);
        });
      });
    }
  }
};

export default user;
