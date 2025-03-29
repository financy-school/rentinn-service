export interface CONFIG_MAP {
  [key: string]: {
    location: string;
    secret?: string;
    ttl: number;
    versionId?: string;
    keys?: [];
    default?: any;
  };
}
export const CONFIG_MAP: CONFIG_MAP = {
  //configName:{location:secretManger,secret ,ttl,versionId}
  test: {
    location: 'AWS_SECRET_MANAGER',
    secret: 'test',
    ttl: 86400,
    versionId: 'kfnkjdfgkjdfgbnkdnfgkdnfgkjdfgdkmfngj',
  },
};
