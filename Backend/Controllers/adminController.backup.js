
import * as Auth from '../Services/authService.js';
import * as Service from '../Services/serviceService.js';
import * as AppointmentService from '../Services/appointmentService.js';

const fail = (res, e) => {
  if (!e.status) console.error(e);

  res.status(e.status || 500).json({
    message: e.status ? e.message : 'Something went wrong.',
    errors: e.errors
  });
};

// ================= ADMIN AUTHENTICATION =================

export const login = async (req, res) => {
  try {
    res.json(await Auth.login(req.body.username, req.body.password));
  } catch (e) {
    fail(res, e);
  }
};

export const me = (req, res) => res.json({ admin: req.admin });

// ================= SERVICE MANAGEMENT =================

// Get all services, including inactive
export const getAllServices = async (_req, res) => {
  try {
    res.json(await Service.listAllServices());
  } catch (e) {
    fail(res, e);
  }
};

// Add a new service
export const createService = async (req, res) => {
  try {
    const service = await Service.createService(req.body);
    res.status(201).json({
      message: 'Service created successfully.',
      service
    });
  } catch (e) {
    fail(res, e);
  }
};

// Update service details
export const updateService = async (req, res) => {
  try {
    const service = await Service.updateService(
      req.params.id,
      req.body
    );

    res.json({
      message: 'Service updated successfully.',
      service
    });
  } catch (e) {
    fail(res, e);
  }
};

// Activate or deactivate a service
export const changeServiceStatus = async (req, res) => {
  try {
    const service = await Service.changeServiceStatus(
      req.params.id,
      req.body.active
    );

    res.json({
      message: 'Service status updated successfully.',
      service
    });
  } catch (e) {
    fail(res, e);
  }
};

// ================= BLOCKED DATE MANAGEMENT =================

// Get blocked dates
export const getBlockedDates = async (req, res) => {
  try {
    res.json(
      await Service.listBlockedDates(req.query.serviceId)
    );
  } catch (e) {
    fail(res, e);
  }
};

// Add a blocked date
export const createBlockedDate = async (req, res) => {
  try {
    const blockedDate = await Service.createBlockedDate(req.body);

    res.status(201).json({
      message: 'Blocked date added successfully.',
      blockedDate
    });
  } catch (e) {
    fail(res, e);
  }
};

// Delete a blocked date
export const deleteBlockedDate = async (req, res) => {
  try {
    const result = await Service.removeBlockedDate(req.params.id);
    res.json(result);
  } catch (e) {
    fail(res, e);
  }
};

export const confirmAppointment = async (req, res) => {
  try {
    const result = await AppointmentService.confirmAppointment(
      req.params.reference
    );

    res.json(result);
  } catch (e) {
    fail(res, e);
  }
};

export const declineAppointment = async (req, res) => {
  try {
    const result = await AppointmentService.declineAppointment(
      req.params.reference,
      req.body
    );

    res.json(result);
  } catch (e) {
    fail(res, e);
  }
};