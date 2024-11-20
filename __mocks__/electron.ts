export const dialog = {
    showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: ['/mock/path'] })),
};