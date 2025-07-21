declare namespace NodeJS {
  interface ProcessEnv {
    BUILD_TYPE?: 'personal' | 'opensource';
    IS_OPEN_SOURCE?: string;
    NODE_ENV?: 'development' | 'production';
  }
} 