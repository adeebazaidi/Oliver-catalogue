// =============================================
// CatalogueGen — SPA Router
// Hash-based routing for static hosting
// =============================================

class Router {
  constructor() {
    this._routes = [];
    this._currentRoute = null;
    this._listeners = [];
    this._container = null;
  }

  init(container) {
    this._container = container;
    window.addEventListener('hashchange', () => this._handleRoute());
    // Initial route
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this._handleRoute();
    }
  }

  addRoute(pattern, handler) {
    this._routes.push({ pattern, handler });
  }

  navigate(path) {
    window.location.hash = path;
  }

  onRoute(fn) {
    this._listeners.push(fn);
  }

  getCurrentRoute() {
    return this._currentRoute;
  }

  _handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    for (const route of this._routes) {
      const params = this._matchRoute(route.pattern, hash);
      if (params !== null) {
        this._currentRoute = { path: hash, pattern: route.pattern, params };

        // Animate transition
        if (this._container) {
          this._container.style.opacity = '0';
          this._container.style.transform = 'translateY(8px)';

          setTimeout(() => {
            route.handler(params);
            this._container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            this._container.style.opacity = '1';
            this._container.style.transform = 'translateY(0)';
          }, 100);
        } else {
          route.handler(params);
        }

        this._listeners.forEach(fn => fn(this._currentRoute));
        return;
      }
    }

    // Fallback: go home
    this.navigate('#/');
  }

  _matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}

export const router = new Router();
