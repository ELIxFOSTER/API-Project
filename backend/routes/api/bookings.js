const express = require("express");
const router = express.Router();

const { setTokenCookie, requireAuth, restoreUser } = require("../../utils/auth");
const { User, Spot, SpotImage, Review, Booking } = require("../../db/models");
const { check } = require("express-validator");
const { Op, ValidationError } = require('sequelize')
const {
  handleValidationErrors,
} = require("../../utils/validation");


const validateBooking = [
    check('endDate')
    .custom((value, { req }) => {
        if (value <= req.body.startDate) {
            throw new Error('endDate cannot be on or before startDate')
        }
    }),
    handleValidationErrors
]

//? Edit a Booking
router.put('/:bookingId', requireAuth, async (req, res, next) => {
 const { bookingId } = req.params
 const { startDate, endDate } = req.body
const userId = req.user.id

const booking = await Booking.findByPk(bookingId)

if (endDate <= startDate) {
    const error = Error('Validation Error')
    error.status = 400
    error.errors = {
        'endDate': 'endDate cannot be on or before startDate'
    }
    next(error)
}


if (userId !== booking.userId) {
    const error = Error('Forbidden')
    error.status = 403
    next(error)
}

if (!booking) {
    const error = Error('Forbidden')
    error.status = 403
    next(error)
}

if (new Date() > booking.endDate) {
    const error = Error("Past bookings can't be modified")
    error.status = 403
    next(error)
}

const spot = await Spot.findByPk(booking.spotId)

const allBookings = await Booking.findAll({
    where: {
        spotId: spot.id
    }
})

for(let i = 0; i < allBookings.length; i++) {
    let jsonBooking = allBookings[i].toJSON()

    if (jsonBooking.startDate === startDate) {
      const error = Error('Sorry, this spot is already booked for the specific dates')
      error.status = 403
      error.errors = {
        'startDate': 'Start date conflicts with an exists booking'
      }
    }

    if ((new Date(startDate).getTime() < new Date(jsonBooking.endDate).getTime()) && (new Date(startDate).getTime() > new Date(jsonBooking.startDate).getTime())) {
      const error = Error('Sorry, this spot is already booked for the specific dates')
      error.status = 403
      error.errors = {
        'startDate': 'Start date conflicts with an exists booking'
      }
    }

    if (new Date(startDate).getTime() === new Date(jsonBooking.startDate).getTime()) {
      const error = Error('Sorry, this spot is already booked for the specific dates')
      error.status = 403
      error.errors = {
        'startDate': 'Start date conflicts with an existing booking'
      }
      next(error)
    }

    if (new Date(startDate).getTime() === new Date(jsonBooking.endDate).getTime()) {
      const error = Error('Sorry, this spot is already booked for the specific dates')
      error.status = 403
      error.errors = {
        'startDate': 'Start date conflicts with an existing booking'
      }
      next(error)
    }
  }

  const editedBooking = await booking.set({
    startDate,
    endDate
  })

  await editedBooking.save()

  res.status(200)
  console.log(editedBooking)
  return res.json(editedBooking)

})



  //? Get all of the Current User's Bookings
  router.get('/current', requireAuth, async (req, res, next) => {
    const userId = req.user.id

    // const spots = await Spot.findAll()

      const bookings = await Booking.findAll({
        where: {
          userId
        },
        include: [
          {
            model: Spot,
            attributes: { exclude: ['createdAt', 'updatedAt', 'description'] }
          }
        ]
      })

      let answer = []
      for (let each of bookings) {
        const booking = each.toJSON()
        let eachObj = {}

        let previewImage = await SpotImage.findAll({
            where: {
                [Op.and]: [
                    { spotId: booking.spotId },
                    { preview: true }
                ]
            },
            raw: true
        })

        eachObj.id = booking.id
        eachObj.spotId = booking.spotId
        eachObj.Spot = booking.Spot
        if (previewImage[0]) {
            eachObj.Spot.previewImage = previewImage[0].url
        } else {
            eachObj.Spot.previewImage = 'No preview image url'
        }
        eachObj.userId = booking.userId
        eachObj.startDate = booking.startDate
        eachObj.endDate = booking.endDate
        eachObj.createdAt = booking.createdAt
        eachObj.updatedAt = booking.updatedAt
        answer.push(eachObj)
      }
      res.status(200)
      return res.json({
        Bookings: answer
      })

  })




  //? Delete a Booking
  router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    const { bookingId } = req.params
    const userId = req.user.id

    const booking = await Booking.findByPk(bookingId)

    if (!booking) {
        const error = Error("Booking couldn't be found")
        error.status = 404
        next(error)
    }

    if (booking.startDate < new Date()) {
        const error = Error("Bookings that have been started can't be deleted")
        error.status = 403
        next(error)
    }

    await booking.destroy()
    res.status(200)
    return res.json({
        message: 'Successfully deleted',
        statusCode: 200
    })



  })





module.exports = router