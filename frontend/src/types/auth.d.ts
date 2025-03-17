// src/types/auth.d.ts
declare module 'jwt-decode' {
    function jwtDecode<T = unknown>(token: string): T;
    export default jwtDecode;
  }