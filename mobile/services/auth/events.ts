// Simple event emitter for auth events
type AuthEventListener = () => void;

class AuthEvents {
  private listeners: AuthEventListener[] = [];

  subscribe(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emitSignOut(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const authEvents = new AuthEvents();
