(function () {
  function request(collection, method, body, token) {
    const options = { method, headers: {} };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    return fetch(`/api/data?collection=${encodeURIComponent(collection)}`, options)
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Error de Firebase.');
        return result;
      });
  }

  function createQuery(collection, token) {
    const query = {
      select() {
        return query;
      },
      order() {
        return query;
      },
      limit() {
        return query;
      },
      then(resolve, reject) {
        return request(collection, 'GET', null, token)
          .then((result) => ({ data: result.data || [], error: null }))
          .then(resolve, reject);
      },
      insert(records) {
        return request(collection, 'POST', { records }, token)
          .then((result) => ({ data: result.data || [], error: null }));
      },
      upsert(records) {
        return request(collection, 'POST', { records }, token)
          .then((result) => ({ data: result.data || [], error: null }));
      },
      delete() {
        query.deleteRequested = true;
        return query;
      },
      eq(field, value) {
        if (!query.deleteRequested || field !== 'id') {
          return Promise.resolve({ data: [], error: null });
        }
        return request(collection, 'POST', {
          action: 'delete',
          records: [{ id: value }]
        }, token).then((result) => ({ data: result.data || [], error: null }));
      }
    };
    return query;
  }

  window.firebaseApi = {
    from(collection, token) {
      return createQuery(collection, token || sessionStorage.getItem('barriguitas_firebase_token') || '');
    },
    async login(email, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No fue posible iniciar sesión.');
      return result;
    },
    async loginWithGoogle() {
      const configResponse = await fetch('/api/auth/config');
      const config = await configResponse.json();
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        throw new Error('Falta configurar Firebase Web en el servidor.');
      }
      if (!window.firebase || !window.firebase.auth) {
        throw new Error('No se pudo cargar Firebase Authentication.');
      }
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(config);
      }
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const credential = await window.firebase.auth().signInWithPopup(provider);
      const idToken = await credential.user.getIdToken(true);
      return { idToken };
    }
  };
}());
