import request from './request';
import requestWithoutTimeout from './requestWithoutTimeout';

const categoryService = {
  getAll: (params) =>
    request.get('dashboard/admin/categories/paginate', { params }),
  getAllMain: (params) => request.get('dashboard/admin/categories', { params }),
  selectPaginate: (params) =>
    request.get('dashboard/admin/categories/select-paginate', { params }),
  getById: (id, params) =>
    request.get(`dashboard/admin/categories/${id}`, { params }),
  create: (data) => request.post('dashboard/admin/categories', data),
  update: (id, data) => request.put(`dashboard/admin/categories/${id}`, data),
  delete: (params) =>
    request.delete(`dashboard/admin/categories/delete`, { params }),
  search: (params) =>
    request.get('dashboard/admin/categories/search', { params }),
  setActive: (id) => request.post(`dashboard/admin/categories/${id}/active`),
  dropAll: () => request.get(`dashboard/admin/categories/drop/all`),
  restoreAll: (params) =>
    request.get(`dashboard/admin/categories/restore/all`, { params }),
  export: (params) =>
    requestWithoutTimeout.get('dashboard/admin/categories/export', { params }),
  import: (data) =>
    requestWithoutTimeout.post('dashboard/admin/categories/import', data),
  updatePosition: (uuid, data) =>
    request.post(`dashboard/admin/category-input/${uuid}`, data),
  paginateSelect: (params) =>
    request.get('dashboard/admin/categories/select-paginate', { params }),
  statusUpdate: (id, data) =>
    request.post(`dashboard/admin/categories/${id}/status`, data),
};

export default categoryService;
